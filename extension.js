
const GETTEXT_DOMAIN = 'my-indicator-extension';

const { GObject, St, Clutter } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const GLib = imports.gi.GLib;
const ByteArray = imports.byteArray;
const Util = imports.misc.util;

const _ = ExtensionUtils.gettext;


const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init() {
            super._init(0.0, _(''));
            
            this._box = new St.BoxLayout();

            this.scrollbox = new St.ScrollView({
                height: 400,
                width: 330,
                hscrollbar_policy: 2,
                vscrollbar_policy: 2,
                enable_mouse_scrolling: true
            });

            this._icon0 = new St.Icon({
                icon_name: 'audio-x-generic',
                style_class: 'system-status-icon',
            });
            this.add_style_class_name('main-panel') 
            
            this._box.add(this._icon0);

            this.actor.add_actor(this._box);

            this.actor.add_style_class_name('panel-status-button');

            this._inputF = new St.Entry({
                name: "searchEntry",
                hint_text: _("search video in YouTube ..."),
                track_hover: true,
                can_focus: true,
                style_class: 'entry'
            });

            this._search = new St.Button({ can_focus: true,child: this._icon0, toggle_mode: true });
                        
            this._searchresult = []

            this.item = new PopupMenu.PopupBaseMenuItem({
                activate:false,
            });

            this.vbox = new St.BoxLayout({
                vertical: true,
                style_class: "datemenu-displays-box",
                style: "border:10px;"
            });

            this.vbox_del = new St.BoxLayout({
                vertical: true,
                style_class: "datemenu-displays-box",
                style: "border:10px;"
            });

            this.vbox_sdel = new St.ScrollView({
                enable_mouse_scrolling: true
            });

            this.vbox_sdel.add_actor(this.vbox_del);

            this.scrollbox.add_actor(this.vbox);

            this.vbox.add(this._inputF);

            this.vbox.add(this.vbox_sdel);

            this._inputF.clutter_text.connect('activate', async (actor) => {
                log(`Activated: ${actor.text}`);
                Main.notify(_('Searching ...'));

                this.vbox_sdel.remove_actor(this.vbox_del);

                this.vbox_del = new St.BoxLayout({
                    vertical: true,
                    style_class: "datemenu-displays-box",
                    style: "border:10px;"
                });
                this.vbox_sdel.add_actor(this.vbox_del);

                // for (let i in  this._searchresult){
                //     this.vbox_del.remove(this._searchresult[i])
                //     this._searchresult=[]
                // }
                

                let [, stdout, stderr, status] = GLib.spawn_command_line_sync(`/usr/local/bin/node .local/share/gnome-shell/extensions/streama@thelinuxpoint.github.io/search.js '${actor.text}'`);
                
                try{

                    if (status !== 0) {
                        if (stderr instanceof Uint8Array){
                            stderr = ByteArray.toString(stderr);
                        }

                        throw new Error(stderr);
                    }

                    if (stdout instanceof Uint8Array){
                        stdout = ByteArray.toString(stdout);
                    }

                } catch (e) {

                    logError(e);
                }
                
                var json = JSON.stringify(eval("(" + stdout + ")"));
                let map = JSON.parse(json);

                for (let i of map.videos ){
                    let menuPref = new PopupMenu.PopupMenuItem(i.title.toString());
                    this.vbox_del.add(menuPref);
                    // this._searchresult.push(menuPref)
                }


            });



            this.menu.box.add(this.scrollbox);
            this.menu.addMenuItem(this.item,3);
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(), 2);

            // Setting Menu
            let menuPref = new PopupMenu.PopupMenuItem("Stop");

            menuPref.connect('activate', () => {
                Main.notify(_('stopped'));
            });

            this.menu.addMenuItem(menuPref, 3);

            let menuPref0 = new PopupMenu.PopupMenuItem("Settings");

            menuPref0.connect('activate', () => {
                Main.notify(_('settings'));
            });

            this.menu.addMenuItem(menuPref0, 3);
            
        }

        _addSearchButton() {

            let menuPref = new PopupMenu.PopupMenuItem("Settings");
            // this.menu.addMenuItem(menuPref, 3);
            this.vbox_del.add(menuPref);
        }
    }
);


class Extension {
    constructor(uuid) {
        this._uuid = uuid;
        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this._uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
