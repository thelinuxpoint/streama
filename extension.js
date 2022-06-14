
const GETTEXT_DOMAIN = 'my-indicator-extension';

const { GObject, St, Clutter } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Gio = imports.gi.Gio;


const _ = ExtensionUtils.gettext;

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init() {
            super._init(0.0, _(''));


            this._inputF = new St.Entry({
                name: "searchEntry",
                hint_text: _("Text to search ..."),
                track_hover: true,
                can_focus: true,
            });


            this.add_child(
                new St.Label({
                    text : "streama",
                    y_align: Clutter.ActorAlign.CENTER,
                })   
            );


            this.item = new PopupMenu.PopupMenuItem(_('Search'));

            this.item.connect('activate', () => {
                Main.notify(_('SEARCHED'));
            });

            this.menu.addMenuItem(this.item,1);

    
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
