// THE IMPORTS ######################################
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
const Shell = imports.gi.Shell;

const { Slider } = imports.ui.slider;
// THE CODES ############################################
//########################################################
class PopupSliderMenuItem extends PopupMenu.PopupBaseMenuItem {
    _init(params) {

        super._init(params,value);
        this._slider = new Slider.Slider(value);
        this.actor = this._slider.actor;
    }
}

function VolSliderItem() {
    this._init.apply(this, arguments);
}

VolSliderItem.prototype = {
    __proto__: PopupSliderMenuItem.prototype,

    _init: function(text, icon, style, value) {
        PopupSliderMenuItem.prototype._init.call(this, value);

        this.removeActor(this._slider);
        this._holder = new St.BoxLayout();

        this._icon = new St.Icon({
            icon_size: 12,
            icon_name: icon,
            style_class: 'icon-volume'});
        this._holder.add_actor(this._icon);

        this._label = new St.Label({text: text, style_class: "label-class"});
        this._holder.add_actor(this._label);
        this.addActor(this._holder);
        this.addActor(this._slider, { span: -1, expand: false, align: St.Align.END });
    },

    setIcon: function(icon) {
        this._icon.icon_name = icon;
    }
}

// Control Button #######################################
function ControlButton() {
    this._init.apply(this, arguments);
}

ControlButton.prototype = {
    _init: function(icon, isize, callback) {
        this.actor = new St.Bin({style_class: 'control-button-container'});
        this.button = new St.Button({ style_class: 'button-control' });
        this.button.connect('clicked', callback);
        this.icon = new St.Icon({
            
            icon_name: icon,
            icon_size: isize,
            style_class: 'button-icon',
        });
        this.button.set_child(this.icon);
        this.actor.add_actor(this.button);

    },
    getActor: function() {
        return this.actor;
    },
    setIcon: function(icon) {
        this.icon.icon_name = icon;
    }
}
//#######################################################################
const MainItem = GObject.registerClass({
    GTypeName: 'MainItem',
    GTypeFlags: GObject.TypeFlags.ABSTRACT
}, class MainItem extends PopupMenu.PopupBaseMenuItem {
    _init() {
        super._init();
        this._ornamentLabel.y_align = Clutter.ActorAlign.CENTER;
        this._ornamentLabel.y_expand = true;
        this._signals = [];
        this.pushSignal(this, 'destroy', this._onDestroy.bind(this));
    }

    pushSignal(obj, signalName, callback) {
        let signalId = obj.connect(signalName, callback);
        this._signals.push({
            obj: obj,
            signalId: signalId
        });
        return signalId;
    }

    _onDestroy() {
        if (this._signals) {
            this._signals.forEach(signal => signal.obj.disconnect(signal.signalId));
            this._signals = null;
        }
    }
});

//##################################################################
const Volume = GObject.registerClass({
    GTypeName: 'Volume'
}, class Volume extends MainItem {
    _init() {
        super._init();
        this._mpris = null;
        this._value = 0.0;
        this._preMuteValue = 0.0;
        this._preDragValue = 0.0;
        this._muted = false;
        this._icon = new St.Icon({
            icon_name: 'audio-volume-muted-symbolic',
            style_class: 'popup-menu-icon',
        });

        this.add_child(this._icon);

        this._slider = new Slider(0);
        this._slider.accessible_name = _("Volume");;
        this._slider.x_expand = true;

        this.add_child(this._slider);

        this.pushSignal(this, 'scroll-event', (actor, event) => {
            return this._slider._onScrollEvent(actor, event);
        });

        this.pushSignal(this, 'touch-event', (actor, event) => {
            return this._slider._touchDragging(actor, event);
        });

        this.pushSignal(this, 'button-press-event', (actor, event) => {
            if (event.get_button() === Clutter.BUTTON_SECONDARY) {
                this.toggleMute();
            }
            return this._slider.startDragging(event);
        });

        this.pushSignal(this, 'key-press-event', (actor, event) => {
            return this._slider.onKeyPressEvent(actor, event);
        });

        this._sliderChangedId = this.pushSignal(this._slider, 'notify::value', () => {
            this.value = this._sliderValue;
        });

        this.pushSignal(this._slider, 'drag-begin', () => {
            this._preDragValue = this.value;
        });

        this.pushSignal(this._slider, 'drag-end', () => {
            this.remove_style_pseudo_class('active');
            if (this._preDragValue && !this.value) {
                this._preMuteValue = this._preDragValue;
                this._muted = true;
            }
        });
    }
});


// S ###########################
// MUSIC INT BOX ######################################

function MusicIntBox() {
    this._init.apply(this, arguments);
}

MusicIntBox.prototype = {

    _init: function (top) {  

        this._holder = new St.BoxLayout({ 
            y_expand: false,
            x_expand: true,
            vertical:true,
            x_align: Clutter.ActorAlign.CENTER,
            y_align:  Clutter.ActorAlign.END
        });

        this._controls = new St.BoxLayout({vertical:false,});
                
        this._volume = new Volume();

        this._stopButton = new ControlButton('media-playback-stop-symbolic', 20,
            Lang.bind(this, function () { 
        }));
        this._prevButton = new ControlButton('media-skip-backward', 20,
            Lang.bind(this, function () { 
        }));
        
        this._playButton = new ControlButton('media-playback-start',20,
            Lang.bind(this, function () { 
        }));
        
        this._nextButton = new ControlButton('media-skip-forward', 20,
            Lang.bind(this, function () { 

        }));
        this._folderButton = new ControlButton('system-file-manager-symbolic', 20,
            Lang.bind(this, function () { 
            Main.notify(_('No Folder Selected'));


        }));
        this._spaceButtonTwo = new St.Bin({style_class: 'spaceb'});

        this._settButton = new ControlButton('window-close-symbolic', Math.floor(20 * 0.8),
            Lang.bind(this, function () { 
                top.vbox_sdel.remove_actor(top.vbox_del);
                top.vbox_del = new St.BoxLayout({
                    vertical: true,
                    style_class: "datemenu-displays-box",
                    style: "border:10px;"
                });

                top.vbox_sdel.add_actor(top.vbox_del);
            })
        );
        
        this._controls.add_actor(this._stopButton.getActor());

        this._controls.add_actor(this._prevButton.getActor());
        this._controls.add_actor(this._playButton.getActor());
        this._controls.add_actor(this._nextButton.getActor());
        this._controls.add_actor(this._folderButton.getActor());

        this._controls.add_actor(this._settButton.getActor());
       
        this._holder.add(this._controls);
        this._holder.add(this._volume);
        
    },

    getActor: function() {
        return this._holder;
    },
    
}

// ####################################################################

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init() {
            super._init(0.0, _(''));
            
            this._box = new St.BoxLayout();

            this.scrollbox = new St.ScrollView({
                height: 500,
                width: 350,
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

            // The Control Box ##########################################

            this._cbox = new St.BoxLayout({y_align: Clutter.ActorAlign.END});

            this._mainMusicBox = new MusicIntBox(this);

            // END OF CONTROL BOX ########################################
            this.vbox.add(this._mainMusicBox.getActor());
            
            this.vbox.add(this._cbox);

            this._inputF.clutter_text.connect('activate', async (actor) => {
                log(`Activated: ${actor.text}`);

                this.vbox_sdel.remove_actor(this.vbox_del);

                this.vbox_del = new St.BoxLayout({
                    vertical: true,
                    style_class: "datemenu-displays-box",
                    style: "border:10px;"
                });

                this.vbox_sdel.add_actor(this.vbox_del);        

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
                    menuPref.connect('activate', () => {                        
                        GLib.spawn_command_line_async(`/usr/local/bin/node .local/share/gnome-shell/extensions/streama@thelinuxpoint.github.io/stream.js ${i.url.toString()}`);
                    });
                    this.vbox_del.add(menuPref);
                }
            });

            this.menu.box.add(this.scrollbox);

            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(), 2);

            // Setting Menu
            let menuPref0 = new PopupMenu.PopupMenuItem("Settings");
            menuPref0.connect('activate', () => {
                
            });
            this.menu.addMenuItem(menuPref0, 3);
            
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
