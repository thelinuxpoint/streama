
const GETTEXT_DOMAIN = 'my-indicator-extension';

const { GObject, St, Clutter } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Gio = imports.gi.Gio;
const Lang = imports.lang;


const _ = ExtensionUtils.gettext;

const yts = require('yt-search');

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init() {
            super._init(0.0, _('streama'));
            
            this._box = new St.BoxLayout();

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
                        
            // this.add_child(
            //     new St.Label({
            //         text : "streama",
            //         y_align: Clutter.ActorAlign.CENTER,
            //     })   
            // );


            this.item = new PopupMenu.PopupBaseMenuItem({
                activate:false,
            });

            this.item.add_child(this._inputF);

            this._inputF.clutter_text.connect('activate', async (actor) => {
                log(`Activated: ${actor.text}`);
                Main.notify(_('stopped'));
                orp = await yts( 'DJ Snake' )
                log(`search: ${orp}`);


            });

            // this.item.actor.add(this._inputF);
            // this.item.connect('activate', () => {
            //     Main.notify(_('SEARCHED'));
            // });

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
            this.menu.addMenuItem(menuPref, 3);
        
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
