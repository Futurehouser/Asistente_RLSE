#!/usr/bin/env python3
"""Asistente deploy RLSE Aquaplus — versión Python (Tkinter, solo librería estándar).

Ejecutar:  python Asistente_RLSE.py
"""
import base64
import datetime as dt
import json
import os
import queue
import subprocess
import sys
import tempfile
import threading
import tkinter as tk
import urllib.request
import webbrowser

# El build (python/build_single.py) rellena estas dos constantes para generar
# un único archivo Asistente_RLSE.py con las imágenes incrustadas.
APP_VERSION = None  # @@VERSION@@
EMBEDDED_IMAGES = {}  # @@IMAGES@@

REPO = 'Futurehouser/Asistente_RLSE'
PY_ASSET = 'Asistente_RLSE.py'
HERE = os.path.dirname(os.path.abspath(__file__))
SETTINGS_FILE = os.path.join(os.path.expanduser('~'), '.asistente_rlse.json')

TEMPLATE_URL = (
    'https://santander.service-now.com/now/nav/ui/classic/params/target/rm_release.do%3Fsys_id%3D09f6ac703333c750eb351b989d5c7bb6'
    '%26sysparm_domain%3Dnull%26sysparm_domain_scope%3Dnull%26sysparm_record_list%3Dsys_class_name%253drm_release%255eopened_by'
    '%253dcd7ec8dc8717b4589cda54673cbb35b3%255eu_segregation_restricted%253dfalse%255eu_segregation_domainsCONTAINS6b3fa9f887c3e990389dc9dc8bbb353f'
    '%255eORu_segregation_domainsCONTAINS7c0842bc1bea39105e74ec22604bcb39%255eORu_segregation_domainsCONTAINSf3f071348747e990389dc9dc8bbb3523'
    '%255eORu_segregation_domainsCONTAINS3db6322b1b5c21105ae05532604bcbec%255eORDERBYsys_created_on%255eORDERBYsys_id%26sysparm_record_row%3D11'
    '%26sysparm_record_rows%3D11%26sysparm_view%3Drelease%26sysparm_view_forced%3Dtrue%26sysparm_view_resolved%3Drelease'
)

DEFAULT_HUS = '\n'.join([
    'Ajustamos el algoritmo de fondo de comercio en loan tape espejo (https://san-scib.atlassian.net/browse/SCIBAQAPLS-19530)',
    'componentes de planificacion controlM (https://san-scib.atlassian.net/browse/SCIBAQAPLS-19209)',
    'Cambiar origen de datos de Ratings Externos diarios en ATB espejo (https://san-scib.atlassian.net/browse/SCIBAQAPLS-18160)',
])

TEMPLATE_DESCRIPTION = '\n'.join([
    '- High Level & Non-Technical Language Description Summary:',
    '',
    '[INPUT 1]',
    '',
    '- What BENEFIT will this change bring?:',
    '',
    'Historias de usuario de Jira:',
    '',
    '[INPUT 2]',
    '',
    'Adaptación de mallas para las ingestas nuevas: fase2',
    '',
    '- Services/Workstreams/Channels Impacted?: Aquaplus',
    '',
    '- Technologies Involved in the Change?: Control- M',
    '',
    '- Has this Type of Change been done before? [YES|NO]: YES',
    '',
    '- Have previous Deployments resulted in any issues? [YES|NO] (If YES explain what happened): NO',
    '',
    "- Any Dependencies with other Changes or it's Self-Contained? (If Dependencies, please add the Change Tickets ):NO",
    '',
    '- Impact on Live Service expected? [YES|NO] (If YES, provide Impact Statement): NO',
    '',
    '- Are we introducing a New Service or moving to New Infrastructure? [YES|NO] (If YES, has PFP (Permit For PRO) been achieved?): NO',
    '',
    '- Is the deployment time window critical? [YES|NO] (If YES, what is the exact time window? That window should include deployment, testing and backout activities ): NO',
    '',
    '- Any impact on Communications? [YES|NO]: NO',
    '',
    '- Any impact on Desktops? [YES|NO]: NO',
    '',
    '- Impacted Countries: Global España',
    '',
    '- Affects the DAILY Accounting Closing? [YES|NO]: NO',
    '',
    '- Affects the MONTHLY Accounting Closing? [YES|NO] : NO',
    '',
    '- Accounting Closing SHKD Contacts: (Only if 2 previous questions apply - MANDATORY to inform Name, Surname and Mobile Phone)',
    '',
    '- Accounting Closing SHKD Tests: (Only if previous question applies - Describe briefly)',
])

TEMPLATE_JUSTIFICATION = '\n'.join([
    '- Reason? [Project|Incident Fix|Vulnerability|Regulatory|Regulatory Compliance|BAU] :',
    '',
    '[INPUT 1]',
    '',
    '- Business Rationale for the Change? (Why?, Value added?, etc...):',
    '',
    '[INPUT 2]',
    '',
    '- Impact of not carrying out the change?: En caso de error humano  los jobs por ejecutar se pueden lanzar de manera manual, los nuevos no tienen peso operativo.',
    'Examples:',
    'i.e.: Regulatory date is the 15/10/2022, if not in prod by them we will be breaching an Industry Regulation',
    'i.e.: Certificate expires on the 13/10/2022, if not implemented by them payments journey will be affected',
])

TEMPLATE_IMPLEMENTATION = '\n'.join([
    '- Implementation Plan including Date, Time, Action and Owner for PRO (Please inform when the Post Implementation Testing is expected):',
    '[INPUT DATE] - Se resolverá el SHAKEDOWN FUNCIONAL, tras el despliegue a PRO vía GitHub Actions el día anterior.',
])

TEMPLATE_SHKD = '\n'.join([
    '- Post Production Implementation Testing (Describe briefly):',
    'Consulta en control-M de la ejecución automática de los jobs',
    '',
    '- SHKD Contacts Detail (MANDATORY to inform Name, Surname and Mobile Phone):',
    'Technical SHKD: [EMAIL] N/A',
    'Functional SHKD: [EMAIL]',
    'Functional SHKD Date:  [INPUT DATE]',
    'Specify Reason if Functional SHKD Date / Los cambios no se hacen efectivos hasta la mañana siguiente',
])

TEMPLATE_EMAIL = '\n'.join([
    'Buenos días Blanca',
    '',
    'Solicitamos tu conformidad para desplegar la RLSE [RLSE CODE] para subir los desarrollos vinculados con las siguientes HU:',
    '',
    '[INPUT HUS]',
    '',
    'Se adjunta plan de pruebas.',
    '',
    'Muchas gracias,',
    '',
    '',
    'Saludos.',
])

WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto',
          'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
CHANGE_GROUP = '> SGT_AP_SCIB_AQUAPLUS N1'

# (título, días respecto a la fecha de PRO, hora, indicación, extras)
DATE_PLAN = [
    ('Fecha de inicio de despliegue a PRE', -2, '13:00:00',
     "(poner esta fecha en la pestaña Schedule, campo 'Preproduction proposed date' y en la tarea de 'Pre-production' también)", None),
    ('Fecha de fin de despliegue a PRE', -2, '23:59:59', "(poner esta fecha en la tarea de 'Pre-production')", None),
    ('Fecha de inicio del despliegue a PRO', 0, '09:00:00',
     "(poner esta fecha en la pestaña Schedule, campo 'Planned start date' y en la tarea de 'Production')", None),
    ('Fecha de fin del despliegue a PRO', 0, '23:59:59', "(poner esta fecha en la tarea de 'Production')", None),
    ('Fecha de inicio de Shakedown Técnico', 1, '09:00:00', "(poner esta fecha en la tarea de 'SKD TÉCNICO')", None),
    ('Fecha de fin de Shakedown Técnico', 1, '23:59:59', "(poner esta fecha en la tarea de 'SKD TÉCNICO')", None),
    ('Fecha de inicio de Shakedown Funcional', 2, '09:00:00',
     "(poner esta fecha en la tarea de 'SKD FUNCIONAL' y copia la primera descripción en 'Implementation plan' de la RLSE "
     "y copia la segunda descripción en 'Test plan' de la RLSE)", 'shkd'),
    ('Fecha de fin de Shakedown Funcional', 2, '23:59:59', "(poner esta fecha en la tarea de 'SKD FUNCIONAL)", 'images'),
    ('Fecha de inicio del Rollback', 0, '09:30:00', '(poner esta fecha en ambas tareas de Rollback)', None),
    ('Fecha de fin del Rollback', 0, '23:59:59', '(poner esta fecha en ambas tareas de Rollback)', None),
]

THEMES = {
    'light': dict(bg='#f4f6fa', surface='#ffffff', text='#1c2333', muted='#5d6779', border='#d5dbe5',
                  accent='#0a74da', accent_text='#ffffff', input='#ffffff', nav='#ffffff', dim='#9aa4b5'),
    'dark': dict(bg='#12161f', surface='#1b212d', text='#e6eaf2', muted='#9aa4b5', border='#2e3747',
                 accent='#4ea3ff', accent_text='#0b1220', input='#141923', nav='#1b212d', dim='#5d6779'),
}

FONT = ('Segoe UI', 10)
FONT_BOLD = ('Segoe UI', 10, 'bold')
FONT_TITLE = ('Segoe UI', 20, 'bold')
FONT_STEP = ('Segoe UI', 12, 'bold')
FONT_MONO = ('Consolas', 10)


# ---------------------------------------------------------------- utilidades
def get_version():
    if APP_VERSION:
        return APP_VERSION
    try:
        with open(os.path.join(HERE, '..', 'package.json'), encoding='utf-8') as f:
            return json.load(f)['version']
    except Exception:
        return '0.0.0'


def parse_version(v):
    return [int(p) if p.isdigit() else 0 for p in str(v).lstrip('vV').split('.')]


def is_newer(remote, local):
    a, b = parse_version(remote), parse_version(local)
    n = max(len(a), len(b))
    return a + [0] * (n - len(a)) > b + [0] * (n - len(b))


def long_date(d):
    """'Miércoles 07 de Octubre'"""
    return f'{WEEKDAYS[d.weekday()]} {d:%d} de {MONTHS[d.month - 1]}'


def add_business_days(base, days):
    """Suma/resta días laborables (salta sábados y domingos). Con 0 devuelve la propia fecha."""
    d = base
    step = dt.timedelta(days=-1 if days < 0 else 1)
    left = abs(days)
    while left > 0:
        d += step
        if d.weekday() < 5:
            left -= 1
    return d


def html_escape(s):
    return (str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            .replace('"', '&quot;').replace("'", '&#39;'))


def copy_html_windows(html, text):
    """Copia HTML (formato 'HTML Format') + texto plano al portapapeles de Windows.
    Devuelve False si no se puede (otro sistema operativo o error)."""
    if sys.platform != 'win32':
        return False
    # Acentos como entidades HTML: se pegan bien lo lea el programa como UTF-8 o como ANSI
    html = html.encode('ascii', 'xmlcharrefreplace').decode('ascii')
    import ctypes
    from ctypes import wintypes
    user32, kernel32 = ctypes.windll.user32, ctypes.windll.kernel32
    user32.OpenClipboard.argtypes = [wintypes.HWND]
    user32.SetClipboardData.argtypes = [wintypes.UINT, wintypes.HANDLE]
    user32.SetClipboardData.restype = wintypes.HANDLE
    user32.RegisterClipboardFormatW.argtypes = [wintypes.LPCWSTR]
    user32.RegisterClipboardFormatW.restype = wintypes.UINT
    kernel32.GlobalAlloc.argtypes = [wintypes.UINT, ctypes.c_size_t]
    kernel32.GlobalAlloc.restype = wintypes.HGLOBAL
    kernel32.GlobalLock.argtypes = [wintypes.HGLOBAL]
    kernel32.GlobalLock.restype = ctypes.c_void_p
    kernel32.GlobalUnlock.argtypes = [wintypes.HGLOBAL]

    def put(fmt, data):
        h = kernel32.GlobalAlloc(0x0002, len(data))  # GMEM_MOVEABLE
        p = kernel32.GlobalLock(h)
        ctypes.memmove(p, data, len(data))
        kernel32.GlobalUnlock(h)
        user32.SetClipboardData(fmt, h)

    # Cabecera CF_HTML con offsets en bytes
    header = ('Version:0.9\r\nStartHTML:{:010d}\r\nEndHTML:{:010d}\r\n'
              'StartFragment:{:010d}\r\nEndFragment:{:010d}\r\n')
    pre = '<html><body><!--StartFragment-->'
    post = '<!--EndFragment--></body></html>'
    head_len = len(header.format(0, 0, 0, 0).encode('utf-8'))
    start_html = head_len
    start_frag = start_html + len(pre.encode('utf-8'))
    end_frag = start_frag + len(html.encode('utf-8'))
    end_html = end_frag + len(post.encode('utf-8'))
    cf_html = (header.format(start_html, end_html, start_frag, end_frag) + pre + html + post).encode('utf-8') + b'\0'
    try:
        if not user32.OpenClipboard(None):
            return False
        try:
            user32.EmptyClipboard()
            put(user32.RegisterClipboardFormatW('HTML Format'), cf_html)
            put(13, (text + '\0').encode('utf-16-le'))  # CF_UNICODETEXT
        finally:
            user32.CloseClipboard()
        return True
    except Exception:
        return False


def load_settings():
    try:
        with open(SETTINGS_FILE, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}


def save_settings(data):
    try:
        with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f)
    except Exception:
        pass


# ---------------------------------------------------------------- app
class App:
    def __init__(self, root):
        self.root = root
        self.version = get_version()
        self.settings = load_settings()
        self.theme = self.settings.get('theme', 'dark')  # modo noche por defecto
        self.c = THEMES[self.theme]
        self.styled = []        # (widget, rol) para re-aplicar colores al cambiar de tema
        self.wrap_labels = []   # (label, margen) cuyo wraplength sigue el ancho de la ventana
        self.images = {}
        self.steps = []
        self.current = 0
        self.shkd_outputs = []  # (salida, plantilla, fecha)
        self.latest = None

        root.title('Asistente deploy RLSE Aquaplus')
        root.geometry('1100x820')
        root.minsize(760, 520)

        self.build_layout()
        self.build_steps()
        self.apply_theme()
        self.show_step(0, scroll=False)
        self.ui_queue = queue.Queue()
        self.poll_queue()
        threading.Thread(target=self.check_update, daemon=True).start()

    # ------------------------------------------------------------ estilos
    def reg(self, widget, role):
        self.styled.append((widget, role))
        self.style(widget, role)
        return widget

    def style(self, w, role):
        c = self.c
        try:
            if role == 'bg':
                w.configure(bg=c['bg'])
            elif role == 'title':
                w.configure(bg=c['bg'], fg=c['text'])
            elif role == 'surface':
                w.configure(bg=c['surface'])
            elif role == 'text':
                w.configure(bg=c['surface'], fg=c['text'])
            elif role == 'link':
                w.configure(bg=c['surface'], fg=c['accent'])
            elif role == 'error':
                w.configure(bg=c['surface'], fg='#d64545')
            elif role in ('input', 'output'):
                w.configure(bg=c['input'], fg=c['text'], insertbackground=c['text'],
                            highlightbackground=c['border'], highlightcolor=c['accent'],
                            readonlybackground=c['input']) if isinstance(w, tk.Entry) else \
                    w.configure(bg=c['input'], fg=c['text'], insertbackground=c['text'],
                                highlightbackground=c['border'], highlightcolor=c['accent'])
            elif role == 'spin':
                w.configure(bg=c['input'], fg=c['text'], insertbackground=c['text'],
                            buttonbackground=c['surface'], highlightbackground=c['border'],
                            highlightcolor=c['accent'], readonlybackground=c['input'])
            elif role == 'btn':
                w.configure(bg=c['accent'], fg=c['accent_text'], activebackground=c['accent'],
                            activeforeground=c['accent_text'], disabledforeground=c['dim'])
            elif role == 'ghost':
                w.configure(bg=c['surface'], fg=c['text'], activebackground=c['border'],
                            activeforeground=c['text'], highlightbackground=c['border'])
            elif role == 'nav':
                w.configure(bg=c['nav'])
            elif role == 'navmuted':
                w.configure(bg=c['nav'], fg=c['muted'])
            elif role == 'topbtn':
                w.configure(bg=c['surface'], fg=c['text'], activebackground=c['border'],
                            activeforeground=c['text'], highlightbackground=c['border'])
            elif role == 'banner':
                w.configure(bg=c['accent'])
                if not isinstance(w, tk.Frame):
                    w.configure(fg=c['accent_text'])
            elif role == 'bannerbtn':
                w.configure(bg=c['accent_text'], fg=c['accent'], activebackground=c['accent_text'],
                            activeforeground=c['accent'])
        except tk.TclError:
            pass

    def apply_theme(self):
        self.c = THEMES[self.theme]
        self.styled = [(w, r) for w, r in self.styled if w.winfo_exists()]
        for w, r in self.styled:
            self.style(w, r)
        self.theme_btn.configure(text='☀' if self.theme == 'dark' else '☾')
        self.update_steps()

    def toggle_theme(self):
        self.theme = 'light' if self.theme == 'dark' else 'dark'
        self.settings['theme'] = self.theme
        save_settings(self.settings)
        self.apply_theme()

    # ------------------------------------------------------------ widgets
    def label(self, parent, text, role='text', font=FONT, wrap=None, **kw):
        kw.setdefault('anchor', 'w')
        kw.setdefault('justify', 'left')
        lbl = self.reg(tk.Label(parent, text=text, font=font, **kw), role)
        if wrap is not None:
            self.wrap_labels.append((lbl, wrap))
        return lbl

    def button(self, parent, text, cmd, role='btn', small=False):
        b = tk.Button(parent, text=text, command=cmd, relief='flat', bd=0, cursor='hand2',
                      font=('Segoe UI', 9 if small else 10, 'bold'),
                      padx=10 if small else 16, pady=3 if small else 7)
        if role == 'ghost':
            b.configure(highlightthickness=1, relief='solid', bd=1)
        return self.reg(b, role)

    def text_input(self, parent, height=3):
        t = tk.Text(parent, height=height, wrap='word', font=FONT, relief='flat', bd=0,
                    highlightthickness=1, padx=8, pady=6, undo=True)
        return self.reg(t, 'input')

    def entry(self, parent, width=40, readonly=False, mono=False):
        e = tk.Entry(parent, width=width, font=FONT_MONO if mono else FONT, relief='flat', bd=0,
                     highlightthickness=1)
        if readonly:
            e.configure(state='readonly')
        self.reg(e, 'input')
        e.configure(insertwidth=1)
        return e

    def output(self, parent, height=10):
        """Celda de salida de texto (solo lectura) con botón Copiar."""
        frame = self.reg(tk.Frame(parent), 'surface')
        bar = self.reg(tk.Frame(frame), 'surface')
        bar.pack(fill='x', pady=(0, 4))
        btn = self.button(bar, 'Copiar', None, role='ghost', small=True)
        btn.pack(side='right')
        txt = tk.Text(frame, height=height, wrap='word', font=FONT, relief='flat', bd=0,
                      highlightthickness=1, padx=8, pady=6, state='disabled')
        self.reg(txt, 'output')
        txt.pack(fill='both', expand=True)
        btn.configure(command=lambda: self.copy(self.get_output(txt), btn))
        frame.text = txt
        return frame

    @staticmethod
    def set_output(frame, value):
        t = frame.text
        t.configure(state='normal')
        t.delete('1.0', 'end')
        t.insert('1.0', value)
        t.configure(state='disabled')

    @staticmethod
    def get_output(txt):
        return txt.get('1.0', 'end-1c')

    def image(self, parent, name, alt):
        img = self.load_image(name)
        if img is None:
            return self.label(parent, f'[Imagen: {alt}]', role='text')
        lbl = tk.Label(parent, image=img, bd=1, relief='solid')
        self.reg(lbl, 'surface')
        return lbl

    def load_image(self, name):
        if name in self.images:
            return self.images[name]
        img = None
        try:
            if name in EMBEDDED_IMAGES:
                img = tk.PhotoImage(data=EMBEDDED_IMAGES[name])
            else:
                path = os.path.join(HERE, 'img', name + '.png')
                if os.path.exists(path):
                    img = tk.PhotoImage(file=path)
        except tk.TclError:
            img = None
        self.images[name] = img
        return img

    def copy(self, value, btn=None):
        if not value:
            return
        self.root.clipboard_clear()
        self.root.clipboard_append(value)
        self.root.update()
        if btn is not None:
            btn.configure(text='¡Copiado!')
            self.root.after(1500, lambda: btn.winfo_exists() and btn.configure(text='Copiar'))

    # ------------------------------------------------------------ estructura
    def build_layout(self):
        root = self.root
        self.reg(root, 'bg')

        # Barra superior: aviso de actualización + botón de tema en la esquina
        self.top = self.reg(tk.Frame(root), 'bg')
        self.top.pack(side='top', fill='x')
        self.banner = self.reg(tk.Frame(self.top), 'banner')
        self.banner_text = self.reg(tk.Label(self.banner, font=FONT_BOLD), 'banner')
        self.banner_text.pack(side='left', padx=(16, 10), pady=6)
        self.banner_btn = self.reg(tk.Button(self.banner, text='Actualizar ahora', relief='flat', bd=0,
                                             font=('Segoe UI', 9, 'bold'), padx=10, pady=2, cursor='hand2',
                                             command=self.install_update), 'bannerbtn')
        self.banner_btn.pack(side='left', pady=6)
        self.theme_btn = tk.Button(self.top, font=('Segoe UI Symbol', 13), width=3, relief='solid', bd=1,
                                   cursor='hand2', command=self.toggle_theme)
        self.reg(self.theme_btn, 'topbtn')
        self.theme_btn.pack(side='right', padx=(6, 12), pady=8)
        # Botón "Buscar actualizaciones", a la izquierda del de tema
        self.checking = False
        self.toast_job = None
        self.update_btn = tk.Button(self.top, text='↻', font=('Segoe UI Symbol', 13), width=3, relief='solid', bd=1,
                                    cursor='hand2', command=self.manual_update_check)
        self.reg(self.update_btn, 'topbtn')
        self.update_btn.pack(side='right', pady=8)
        self.toast = tk.Label(self.top, font=FONT, padx=10, pady=4, relief='solid', bd=1)
        self.reg(self.toast, 'text')

        # Barra de navegación fija abajo
        nav = self.reg(tk.Frame(root, highlightthickness=1), 'nav')
        nav.pack(side='bottom', fill='x')
        inner = self.reg(tk.Frame(nav), 'nav')
        inner.pack(pady=10)
        self.prev_btn = self.button(inner, '←  Paso previo', lambda: self.show_step(self.current - 1))
        self.prev_btn.pack(side='left')
        self.indicator = self.reg(tk.Label(inner, font=FONT, width=14), 'navmuted')
        self.indicator.pack(side='left', padx=18)
        self.next_btn = self.button(inner, 'Paso siguiente  →', lambda: self.show_step(self.current + 1))
        self.next_btn.pack(side='left')
        self.reg(tk.Label(nav, text=f'v{self.version}', font=('Segoe UI', 8)), 'navmuted').place(
            relx=1.0, rely=0.5, x=-14, anchor='e')

        # Zona central con scroll
        body = self.reg(tk.Frame(root), 'bg')
        body.pack(side='top', fill='both', expand=True)
        self.canvas = self.reg(tk.Canvas(body, highlightthickness=0, bd=0), 'bg')
        sb = tk.Scrollbar(body, orient='vertical', command=self.canvas.yview)
        self.canvas.configure(yscrollcommand=sb.set)
        sb.pack(side='right', fill='y')
        self.canvas.pack(side='left', fill='both', expand=True)
        self.content = self.reg(tk.Frame(self.canvas), 'bg')
        self.content_id = self.canvas.create_window((0, 0), window=self.content, anchor='n')
        self.content.bind('<Configure>', lambda e: self.canvas.configure(scrollregion=self.canvas.bbox('all')))
        self.canvas.bind('<Configure>', self.on_resize)
        root.bind_all('<MouseWheel>', self.on_wheel)
        root.bind_all('<Button-4>', lambda e: self.canvas.yview_scroll(-3, 'units'))
        root.bind_all('<Button-5>', lambda e: self.canvas.yview_scroll(3, 'units'))

    def on_resize(self, event):
        self.content_width = min(event.width - 40, 1100)
        self.canvas.itemconfigure(self.content_id, width=self.content_width)
        self.canvas.coords(self.content_id, event.width / 2, 0)
        self.refresh_wrap()

    def refresh_wrap(self):
        width = getattr(self, 'content_width', 1000)
        self.wrap_labels = [(l, m) for l, m in self.wrap_labels if l.winfo_exists()]
        for lbl, margin in self.wrap_labels:
            lbl.configure(wraplength=max(200, width - margin))

    def on_wheel(self, event):
        widget = event.widget
        # Las celdas de texto con scroll propio lo gestionan ellas mismas
        if isinstance(widget, tk.Text) and widget.yview() != (0.0, 1.0):
            return
        self.canvas.yview_scroll(int(-event.delta / 40), 'units')

    def new_step(self, number, title):
        frame = tk.Frame(self.content, highlightthickness=1, bd=0)
        self.reg(frame, 'surface')
        frame.pack(fill='x', pady=10, padx=6)
        header = self.reg(tk.Frame(frame), 'surface')
        header.pack(fill='x', padx=20, pady=(16, 10))
        badge = tk.Label(header, text=str(number), font=FONT_BOLD, width=3)
        badge.pack(side='left')
        self.label(header, title, font=FONT_STEP).pack(side='left', padx=10)
        body = self.reg(tk.Frame(frame), 'surface')
        body.pack(fill='x', padx=20, pady=(0, 18))
        self.steps.append(dict(frame=frame, badge=badge))
        return body

    def update_steps(self):
        c = self.c
        for i, s in enumerate(self.steps):
            active = i == self.current
            s['frame'].configure(highlightthickness=3 if active else 1,
                                 highlightbackground=c['accent'] if active else c['border'],
                                 highlightcolor=c['accent'] if active else c['border'])
            s['badge'].configure(bg=c['accent'] if active else c['border'],
                                 fg=c['accent_text'] if active else c['text'])
        if self.steps:
            self.prev_btn.configure(state='disabled' if self.current == 0 else 'normal')
            self.next_btn.configure(state='disabled' if self.current == len(self.steps) - 1 else 'normal')
            self.indicator.configure(text=f'Paso {self.current + 1} de {len(self.steps)}')

    def show_step(self, i, scroll=True):
        self.current = max(0, min(len(self.steps) - 1, i))
        self.update_steps()
        if scroll:
            self.root.update_idletasks()
            frame = self.steps[self.current]['frame']
            total = max(1, self.content.winfo_height())
            self.canvas.yview_moveto(max(0.0, (frame.winfo_y() - 20) / total))

    # ------------------------------------------------------------ pasos
    def build_steps(self):
        self.label(self.content, 'Asistente deploy RLSE Aquaplus', role='title', font=FONT_TITLE,
                   anchor='center').pack(pady=(10, 22), fill='x')
        self.build_step1()
        self.build_step2()
        self.build_step3()
        self.build_text_step(4, 'GitHub: PR a develop',
                             "Mover todos los cambios a la rama 'development' y una vez estén todos ahí, "
                             "hacer una Pull Request hacia la rama 'develop'.")
        self.build_text_step(5, 'GitHub: PR a main',
                             "Después se hace otra Pull Request desde la rama 'develop' a la rama 'main' "
                             "(Va a requerir aprobación de un tercero).")
        self.build_text_step(6, 'GitHub: Cierre de versión',
                             "Finalmente cerramos versión, usando el workflow de GitHub actions llamado "
                             "'Release workflow' y seleccionar la rama 'main'.")
        self.build_step7()
        self.build_step8()
        self.reg(tk.Frame(self.content, height=30), 'bg').pack()

    def build_step1(self):
        body = self.new_step(1, 'Clonar plantilla')
        row = self.reg(tk.Frame(body), 'surface')
        row.pack(fill='x', pady=(0, 10))
        self.label(row, 'Clona esta RLSE: ', font=FONT_BOLD).pack(side='left')
        link = self.label(row, 'Plantilla RLSE', role='link', font=('Segoe UI', 10, 'bold underline'), cursor='hand2')
        link.pack(side='left')
        link.bind('<Button-1>', lambda e: webbrowser.open(TEMPLATE_URL))
        self.image(body, 'clone-release', 'Botón Clone Release en ServiceNow').pack(anchor='w')

    def build_step2(self):
        body = self.new_step(2, 'Descripción de la RLSE')
        grid = self.reg(tk.Frame(body), 'surface')
        grid.pack(fill='x')
        grid.columnconfigure(1, weight=1)
        self.label(grid, 'Descripción resumida de alto nivel de la RLSE: ', font=FONT_BOLD,
                   wraplength=260).grid(row=0, column=0, sticky='nw', padx=(0, 12), pady=(0, 10))
        self.input1 = self.text_input(grid)
        self.input1.grid(row=0, column=1, sticky='ew', pady=(0, 10))
        self.label(grid, 'Lista de HUs: ', font=FONT_BOLD).grid(row=1, column=0, sticky='nw', padx=(0, 12))
        self.input2 = self.text_input(grid, height=4)
        self.input2.insert('1.0', DEFAULT_HUS)
        self.input2.grid(row=1, column=1, sticky='ew')

        self.button(body, 'Generar descripciones', self.generate_descriptions).pack(anchor='w', pady=(12, 10))
        self.label(body, 'Copia esta descripción en la celda Description de la RLSE', font=FONT_BOLD).pack(anchor='w')
        self.image(body, 'description', 'Celda Description de la RLSE').pack(anchor='w', pady=8)
        self.out_description = self.output(body, height=14)
        self.out_description.pack(fill='x')
        self.label(body, 'Copia este texto en el campo Justification de la RLSE', font=FONT_BOLD).pack(
            anchor='w', pady=(22, 0))
        self.image(body, 'justification', 'Campo Justification de la RLSE').pack(anchor='w', pady=8)
        self.out_justification = self.output(body, height=12)
        self.out_justification.pack(fill='x')

    def generate_descriptions(self):
        i1 = self.input1.get('1.0', 'end-1c')
        i2 = self.input2.get('1.0', 'end-1c')
        fill = lambda tpl: tpl.replace('[INPUT 1]', i1, 1).replace('[INPUT 2]', i2, 1)
        self.set_output(self.out_description, fill(TEMPLATE_DESCRIPTION))
        self.set_output(self.out_justification, fill(TEMPLATE_JUSTIFICATION))

    def build_step3(self):
        body = self.new_step(3, 'Fechas de despliegue')
        self.label(body, 'Correo del responsable de SHKD (Technical y Functional SHKD):', font=FONT_BOLD).pack(anchor='w')
        self.email_var = tk.StringVar(value=self.settings.get('shkdEmail', ''))
        email = self.entry(body, width=46)
        email.configure(textvariable=self.email_var)
        email.pack(anchor='w', pady=(6, 14), ipady=5)
        self.email_var.trace_add('write', lambda *a: self.on_email_change())

        self.label(body, '¿Qué día quieres desplegar la RLSE a PRO?', font=FONT_BOLD).pack(anchor='w')
        row = self.reg(tk.Frame(body), 'surface')
        row.pack(anchor='w', pady=(6, 4))
        today = dt.date.today()
        self.day = tk.StringVar(value=f'{today.day:02d}')
        self.month = tk.StringVar(value=f'{today.month:02d}')
        self.year = tk.StringVar(value=str(today.year))
        for text, var, frm, to, width in (('Día', self.day, 1, 31, 4), ('Mes', self.month, 1, 12, 4),
                                          ('Año', self.year, 2020, 2100, 6)):
            self.label(row, text).pack(side='left', padx=(0, 4))
            sp = tk.Spinbox(row, from_=frm, to=to, textvariable=var, width=width, font=FONT,
                            format='%02.0f' if width == 4 else '%04.0f', relief='flat', highlightthickness=1)
            self.reg(sp, 'spin')
            sp.pack(side='left', padx=(0, 12), ipady=4)
        self.day.set(f'{today.day:02d}')
        self.month.set(f'{today.month:02d}')
        self.year.set(str(today.year))
        self.button(row, 'Generar fechas', self.generate_dates).pack(side='left', padx=(4, 0))
        self.date_error = self.label(body, '', role='error')
        self.date_error.pack(anchor='w')

        self.dates_intro = self.reg(tk.Frame(body), 'surface')
        self.label(self.dates_intro,
                   "Abrir las tareas relacionadas de la RLSE para meter las fechasde inicio y de fin de cada tarea "
                   "(y darle a 'Save' tras cada tarea modificada)", font=FONT_BOLD, wrap=60).pack(anchor='w', fill='x')
        self.image(self.dates_intro, 'release-tasks', 'Tareas relacionadas de la RLSE').pack(anchor='w', pady=8)
        self.dates_out = self.reg(tk.Frame(body), 'surface')
        self.dates_out.pack(fill='x')

    def fill_shkd(self, tpl, date):
        return tpl.replace('[EMAIL]', self.email_var.get().strip()).replace('[INPUT DATE]', date, 1)

    def on_email_change(self):
        self.settings['shkdEmail'] = self.email_var.get().strip()
        save_settings(self.settings)
        for out, tpl, date in self.shkd_outputs:
            if out.winfo_exists():
                self.set_output(out, self.fill_shkd(tpl, date))

    def generate_dates(self):
        for w in self.dates_out.winfo_children():
            w.destroy()
        self.shkd_outputs = []
        try:
            base = dt.date(int(self.year.get()), int(self.month.get()), int(self.day.get()))
        except ValueError:
            self.dates_intro.pack_forget()
            self.date_error.configure(text='Fecha no válida')
            return
        self.date_error.configure(
            text='Atención: la fecha de despliegue a PRO elegida cae en sábado o domingo.' if base.weekday() >= 5 else '')
        self.dates_intro.pack(fill='x', before=self.dates_out, pady=(10, 0))

        for title, offset, time, note, extra in DATE_PLAN:
            d = add_business_days(base, offset)  # solo días laborables
            value = f'{d:%d/%m/%Y} {time}'
            if extra == 'images':
                self.image(self.dates_out, 'implementation-plan', 'Campo Implementation plan').pack(anchor='w', pady=(14, 4))
                self.image(self.dates_out, 'test-plan', 'Campo Test plan').pack(anchor='w', pady=(4, 14))

            row = self.reg(tk.Frame(self.dates_out), 'surface')
            row.pack(fill='x', pady=5)
            left = self.reg(tk.Frame(row), 'surface')
            left.pack(side='left', fill='y' if extra == 'shkd' else 'x', expand=extra != 'shkd', anchor='n')
            if extra == 'shkd':
                lbl = self.label(left, f'{title} {note}', font=FONT_BOLD, wraplength=300)
            else:
                lbl = self.label(left, f'{title} {note}', font=FONT_BOLD, wrap=330)
            cell_row = self.reg(tk.Frame(left if extra == 'shkd' else row), 'surface')
            if extra == 'shkd':
                lbl.pack(anchor='w')
                cell_row.pack(anchor='w', pady=(6, 0))
            else:
                lbl.pack(side='left', fill='x', expand=True, anchor='w')
                cell_row.pack(side='right')
            cell = self.entry(cell_row, width=20, mono=True)
            cell.insert(0, value)
            cell.configure(state='readonly')
            self.style(cell, 'input')
            cell.pack(side='left', ipady=4)
            btn = self.button(cell_row, 'Copiar', None, role='ghost', small=True)
            btn.configure(command=lambda v=value, b=btn: self.copy(v, b))
            btn.pack(side='left', padx=(8, 0))

            if extra == 'shkd':
                outs = self.reg(tk.Frame(row), 'surface')
                outs.pack(side='left', fill='both', expand=True, padx=(14, 0))
                for tpl, date in ((TEMPLATE_IMPLEMENTATION, long_date(d)), (TEMPLATE_SHKD, f'{d:%d/%m/%Y}')):
                    out = self.output(outs, height=13)
                    out.text.configure(width=30, font=('Segoe UI', 9))
                    out.pack(side='left', fill='both', expand=True, padx=(0, 8))
                    self.set_output(out, self.fill_shkd(tpl, date))
                    self.shkd_outputs.append((out, tpl, date))
        self.refresh_wrap()

    def build_text_step(self, number, title, text):
        body = self.new_step(number, title)
        self.label(body, text, wrap=80).pack(anchor='w', fill='x')

    def build_step7(self):
        body = self.new_step(7, 'Email a Blanca')
        self.label(body, 'Código de la RLSE', font=FONT_BOLD).pack(anchor='w')
        row = self.reg(tk.Frame(body), 'surface')
        row.pack(anchor='w', pady=(6, 10))
        self.rlse_code = self.entry(row, width=30)
        self.rlse_code.pack(side='left', ipady=5)
        self.button(row, 'Generar email', self.generate_email).pack(side='left', padx=(12, 0))

        self.email_out = self.reg(tk.Frame(body), 'surface')
        self.label(self.email_out, 'Título del email: ', font=FONT_BOLD).pack(anchor='w')
        self.out_subject = self.output(self.email_out, height=1)
        self.out_subject.pack(fill='x', pady=(6, 0))
        self.label(self.email_out, 'Contenido del email: ', font=FONT_BOLD).pack(anchor='w', pady=(18, 0))
        self.out_body = self.output(self.email_out, height=13)
        self.out_body.pack(fill='x', pady=(6, 0))
        self.label(self.email_out, 'Adjunta el Word del plan de pruebas a este email antes de enviárselo a Blanca',
                   font=FONT_BOLD, wrap=60).pack(anchor='w', fill='x', pady=(18, 0))

    def generate_email(self):
        code = self.rlse_code.get().strip()
        if not code:
            self.rlse_code.focus_set()
            return
        self.set_output(self.out_subject, f'[Aquaplus] RLSE {code}')
        hus = self.input2.get('1.0', 'end-1c')
        self.set_output(self.out_body, TEMPLATE_EMAIL.replace('[RLSE CODE]', code, 1).replace('[INPUT HUS]', hus, 1))
        self.email_out.pack(fill='x')

    def build_step8(self):
        body = self.new_step(8, 'Email a gestión del cambio')
        grid = self.reg(tk.Frame(body), 'surface')
        grid.pack(fill='x')
        grid.columnconfigure(1, weight=1)
        self.label(grid, 'URL de la RLSE: ', font=FONT_BOLD).grid(row=0, column=0, sticky='w', padx=(0, 12), pady=(0, 10))
        self.rlse_url = self.entry(grid)
        self.rlse_url.grid(row=0, column=1, sticky='ew', pady=(0, 10), ipady=5)
        self.label(grid, 'Código de la Task del deploy a PRO: ', font=FONT_BOLD).grid(row=1, column=0, sticky='w', padx=(0, 12), pady=(0, 10))
        self.task_code = self.entry(grid)
        self.task_code.grid(row=1, column=1, sticky='ew', pady=(0, 10), ipady=5)
        self.label(grid, 'URL de la Task del deploy a PRO: ', font=FONT_BOLD).grid(row=2, column=0, sticky='w', padx=(0, 12))
        self.task_url = self.entry(grid)
        self.task_url.grid(row=2, column=1, sticky='ew', ipady=5)
        self.button(body, 'Generar email', self.generate_change_email).pack(anchor='w', pady=(14, 6))
        self.change_error = self.label(body, '', role='error', font=FONT_BOLD)
        self.change_error.pack(anchor='w')

        self.change_out = self.reg(tk.Frame(body), 'surface')
        self.label(self.change_out, 'Título del email: ', font=FONT_BOLD).pack(anchor='w')
        self.out_change_subject = self.output(self.change_out, height=1)
        self.out_change_subject.pack(fill='x', pady=(6, 0))
        self.label(self.change_out, 'Contenido del email: ', font=FONT_BOLD).pack(anchor='w', pady=(18, 0))
        self.out_change_body = self.output(self.change_out, height=17)
        self.out_change_body.pack(fill='x', pady=(6, 0))
        # El botón Copiar de esta celda copia HTML (con el hipervínculo) + texto plano
        copy_btn = self.out_change_body.winfo_children()[0].winfo_children()[0]
        copy_btn.configure(command=lambda: self.copy_change_body(copy_btn))
        self.change_email = None
        self.label(self.change_out, "Adjuntar el email de respuesta de Blanca en formato .eml, el correo del Waiver y "
                                    "el correo de 'RV_RCB Excepción - Requested'",
                   font=FONT_BOLD, wrap=60).pack(anchor='w', fill='x', pady=(18, 0))

    def generate_change_email(self):
        code = self.rlse_code.get().strip()
        try:
            d = dt.date(int(self.year.get()), int(self.month.get()), int(self.day.get()))
        except ValueError:
            d = None
        problems = []
        if not code:
            problems.append('el código de la RLSE (paso 7)')
        if d is None:
            problems.append('una fecha de despliegue a PRO válida (paso 3)')
        if problems:
            self.change_error.configure(text=f"Falta {' y '.join(problems)}.")
            self.change_out.pack_forget()
            return
        self.change_error.configure(text='')
        self.set_output(self.out_change_subject,
                        f'SOLICITUD PARA PRO NORMAL [BANKING] - AQUAPLUS - {code}-{d:%d-%m-%Y}')

        url = self.rlse_url.get().strip()
        task_url = self.task_url.get().strip()
        url = url if url.lower().startswith(('http://', 'https://')) else ''
        task_link = task_url if task_url.lower().startswith(('http://', 'https://')) else ''
        # Texto visible de la tarea: su código (con hipervínculo a su URL)
        task = self.task_code.get().strip() or task_link or task_url
        pretty = long_date(d)

        # Segmentos (texto, url) -> se usan para la vista, el HTML y el texto plano
        segs = [
            ('Buenos días,\n\nSolicitamos que se avance la RLSE ', None), (code, url or None),
            (' para su subida a PRO por nuestra parte (desde GitHub Actions por el equipo de Aquaplus), '
             f'para este {pretty}.\n\n'
             'Se adjunta tanto la conformidad del Usuario de Negocio (Banco) en la propia RLSE, como el correo del RCB '
             'con el ok y el Waiver de vulnerabilidades.\n\n'
             'La tarea a acometer de deploy a PRO es la siguiente junto al grupo encargado de abordarla (una vez se nos '
             'pase la tarea de estado pending a open dentro de la ventana temporal de la tarea), por este orden:\n\n▪ ', None),
            (task, task_link or None),
            (f'\n      • {CHANGE_GROUP}\n\n'
             'Quedamos a vuestra disposición por si hubiera algún dato o información mal consignados, de acuerdo con el '
             'último protocolo para la gestión de cambios fijado.\n\nMuchas gracias\nSaludos', None),
        ]
        self.show_rich(self.out_change_body, segs)

        a = lambda text, href: f'<a href="{html_escape(href)}">{html_escape(text)}</a>' if href else html_escape(text)
        html = '\n'.join([
            '<p>Buenos días,</p>',
            f'<p>Solicitamos que se avance la RLSE {a(code, url)} para su subida a PRO por nuestra parte (desde GitHub '
            f'Actions por el equipo de Aquaplus), para este {html_escape(pretty)}.</p>',
            '<p>Se adjunta tanto la conformidad del Usuario de Negocio (Banco) en la propia RLSE, como el correo del RCB '
            'con el ok y el Waiver de vulnerabilidades.</p>',
            '<p>La tarea a acometer de deploy a PRO es la siguiente junto al grupo encargado de abordarla (una vez se nos '
            'pase la tarea de estado pending a open dentro de la ventana temporal de la tarea), por este orden:</p>',
            f'<ul style="list-style-type:square"><li>{a(task, task_link)}<ul style="list-style-type:disc">'
            f'<li>{html_escape(CHANGE_GROUP)}</li></ul></li></ul>',
            '<p>Quedamos a vuestra disposición por si hubiera algún dato o información mal consignados, de acuerdo con '
            'el último protocolo para la gestión de cambios fijado.</p>',
            '<p>Muchas gracias<br>Saludos</p>',
        ])
        text = ''.join(t + (f' ({u})' if u and t != u else '') for t, u in segs)
        self.change_email = (html, text)
        self.change_out.pack(fill='x')

    def show_rich(self, frame, segs):
        t = frame.text
        t.configure(state='normal')
        t.delete('1.0', 'end')
        for i, (text, url) in enumerate(segs):
            if url:
                tag = f'link{i}'
                t.insert('end', text, (tag,))
                t.tag_configure(tag, foreground=self.c['accent'], underline=True)
                t.tag_bind(tag, '<Button-1>', lambda e, u=url: webbrowser.open(u))
                t.tag_bind(tag, '<Enter>', lambda e: t.configure(cursor='hand2'))
                t.tag_bind(tag, '<Leave>', lambda e: t.configure(cursor=''))
            else:
                t.insert('end', text)
        t.configure(state='disabled')

    def copy_change_body(self, btn):
        if not self.change_email:
            return
        html, text = self.change_email
        if copy_html_windows(html, text):
            btn.configure(text='¡Copiado!')
            self.root.after(1500, lambda: btn.winfo_exists() and btn.configure(text='Copiar'))
        else:
            self.copy(text, btn)

    # ------------------------------------------------------------ actualizaciones
    def check_update(self, manual=False):
        """Comprueba la última release. manual=True (botón) muestra siempre un mensaje con el resultado."""
        # Solo el archivo único publicado en las releases se auto-actualiza
        if not EMBEDDED_IMAGES:
            status = 'unsupported'
        else:
            try:
                req = urllib.request.Request(f'https://api.github.com/repos/{REPO}/releases/latest',
                                             headers={'Accept': 'application/vnd.github+json',
                                                      'User-Agent': 'Asistente-RLSE-Updater'})
                with urllib.request.urlopen(req, timeout=10) as r:
                    rel = json.load(r)
                asset = next((a for a in rel.get('assets', []) if a['name'] == PY_ASSET), None)
                if asset and is_newer(rel['tag_name'], self.version):
                    self.latest = dict(version=rel['tag_name'].lstrip('vV'), url=asset['browser_download_url'])
                    status = 'update'
                else:
                    status = 'latest'
            except Exception:
                status = 'error'
        # Tkinter solo se toca desde el hilo principal: se deja el resultado en la cola
        if status == 'update':
            self.ui_queue.put(self.show_banner)
        if manual:
            self.ui_queue.put(lambda: self.finish_manual_check(status))

    def poll_queue(self):
        """Ejecuta en el hilo principal las acciones que dejan los hilos en segundo plano."""
        try:
            while True:
                self.ui_queue.get_nowait()()
        except queue.Empty:
            pass
        self.root.after(150, self.poll_queue)

    def manual_update_check(self):
        if self.checking:
            return
        self.checking = True
        self.update_btn.configure(text='…', cursor='watch')
        threading.Thread(target=self.check_update, args=(True,), daemon=True).start()

    def finish_manual_check(self, status):
        self.checking = False
        self.update_btn.configure(text='↻', cursor='hand2')
        messages = {
            'update': f"Hay una nueva versión: v{self.latest['version']}" if self.latest else '',
            'latest': f'Ya tienes la última versión (v{self.version}).',
            'unsupported': 'Las actualizaciones solo funcionan en el archivo publicado Asistente_RLSE.py.',
            'error': 'No se pudo comprobar si hay actualizaciones. Revisa tu conexión.',
        }
        self.show_toast(messages[status])

    def show_toast(self, msg):
        self.toast.configure(text=msg)
        self.toast.pack(side='right', padx=(0, 4), pady=8)
        if self.toast_job:
            self.root.after_cancel(self.toast_job)
        self.toast_job = self.root.after(4000, self.toast.pack_forget)

    def show_banner(self):
        self.banner_text.configure(text=f"Nueva versión disponible: v{self.latest['version']} (actual v{self.version})")
        self.banner_btn.configure(state='normal')
        if not self.banner.winfo_ismapped():
            self.banner.pack(side='left', fill='x', expand=True)

    def install_update(self):
        if not self.latest:
            return
        self.banner_btn.configure(state='disabled')
        self.banner_text.configure(text='Descargando actualización…')
        threading.Thread(target=self._download_update, daemon=True).start()

    def _download_update(self):
        target = os.path.abspath(__file__)
        try:
            req = urllib.request.Request(self.latest['url'], headers={'User-Agent': 'Asistente-RLSE-Updater'})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            fd, tmp = tempfile.mkstemp(suffix='.py', dir=os.path.dirname(target))
            with os.fdopen(fd, 'wb') as f:
                f.write(data)
            os.replace(tmp, target)
            self.ui_queue.put(lambda: self._restart(target))
        except Exception as exc:
            msg = f'Error al actualizar: {exc}'
            self.ui_queue.put(lambda: (self.banner_text.configure(text=msg),
                                       self.banner_btn.configure(state='normal')))

    def _restart(self, target):
        self.banner_text.configure(text='Reiniciando…')
        subprocess.Popen([sys.executable, target])
        self.root.destroy()


def main():
    if sys.platform == 'win32':
        try:
            import ctypes
            ctypes.windll.shcore.SetProcessDpiAwareness(1)
        except Exception:
            pass
    root = tk.Tk()
    App(root)
    root.mainloop()


if __name__ == '__main__':
    main()
