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
const DBus = Gio.DBusProxy;
const _ = ExtensionUtils.gettext;
const Shell = imports.gi.Shell;

let icon_path = null;
let compatible_players = null;
let support_seek = null;
let coverpathmusic = null;
let coverpathpause = null;
let coverpathplay = null;
let preferences_path = null;
let default_setup = "0";
let music_label = false;
let cover_overlay = true;
let notification_option = true;
let has_gsettings_schema = false;
let MusicEnabled = null;
let MusicVolumeOption = null;
let MusicIndicators = []; 
let MusicSources = []; 
let MusicNotifications = []; 
let MusicVolumePlayers = [];
let MusicPlayersList = [];



// THE CODES ############################################
function ToggleItem() {
    this._init.apply(this, arguments);
}

ToggleItem.prototype = {
    __proto__: PopupMenu.PopupSwitchMenuItem.prototype,

    _init: function(text, icon, active, params) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, params);

        this._holder = new St.BoxLayout();
        this.addActor(this._holder);

        this._icon = new St.Icon({
            icon_type: St.IconType.SYMBOLIC,
            icon_size: 12,
            icon_name: icon});
        this._iconbox = new St.Bin();
        this._iconbox.add_actor(this._icon);
        this._holder.add_actor(this._iconbox);

        this.label = new St.Label({ text: text, style_class: "label-class" });
        this._holder.add_actor(this.label);
        
        this._switch = new PopupMenu.Switch(active);
        this.addActor(this._switch.actor, { span: -1, expand: false, align: St.Align.END });

        this.updateIcon();
    },

    updateIcon: function() {
        if (this._switch.state) this._iconbox.set_opacity(255);
        else this._iconbox.set_opacity(100);
    },

    activate: function () {
        this.toggle();
        this.updateIcon();
    },

    setToggleState: function(state) {
        this._switch.setToggleState(state);
        this.updateIcon();
    }
}

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

// S ###########################
// MUSIC INT BOX ######################################

function MusicIntBox() {
    this._init.apply(this, arguments);
}

MusicIntBox.prototype = {
    _init: function (owner, coversize, buttonsize, overlay, openbutton, styleprefix) {  


        this._appsys = Shell.AppSystem.get_default();
        this._appobj = this._appsys.lookup_app(this._name + ".desktop");
        this._playerstate = true;

        //Actor that holds everything
        this._holder = new St.BoxLayout({style_class: styleprefix + 'mib-track-box'});
        this.actor = new St.Bin({style_class: styleprefix + 'mib-track-actor-holder', x_align: St.Align.MIDDLE})
        this.actor.set_child(this._holder);

        //Track CoverArt
        // this._trackCoverArt = new CoverArt(owner, coversize, overlay, styleprefix);
        //Holders
        this._trackInfoHolder = new St.Bin({style_class: styleprefix + 'mib-track-info-holder', y_align: St.Align.MIDDLE});
        this._trackControlHolder = new St.Bin({style_class: styleprefix + 'mib-track-control-holder', x_align: St.Align.MIDDLE});
        // this._holder.add_actor(this._trackCoverArt.getActor());
        this._holder.add_actor(this._trackInfoHolder);

        //Track Information
        this._infos = new St.BoxLayout({vertical: true, style_class: styleprefix + 'mib-track-info'});
        this._title = new St.Label({text: "NIL", style_class: 'mib-track-title'});
        this._infos.add_actor(this._title);
        this._artist = new St.Label({text: _('Artist')});
        this._infos.add_actor(this._artist);
        this._album = new St.Label({text: _('Album')});
        this._infos.add_actor(this._album);
        this._infos.add_actor(this._trackControlHolder);
        this._trackInfoHolder.set_child(this._infos);

        //Buttons
        this._raiseButton = new ControlButton('media-eject', Math.floor(buttonsize * 0.9),
            Lang.bind(this, function () { 
                Main.overview.hide();
                // this._mediaServer.RaiseRemote(); 
                Mainloop.timeout_add(100, Lang.bind(this, function () {
                    windowm = this._appobj.get_windows()[0];
                    Main.activateWindow(windowm);
                }));
            })
        );

        this._spaceButton = new St.Bin({style_class: 'spaceb'});
        
        this._prevButton = new ControlButton('media-skip-backward', buttonsize,
            Lang.bind(this, function () { 
        }));
        
        this._playButton = new ControlButton('media-playback-start', buttonsize,
            Lang.bind(this, function () { 
        }));
        
        this._nextButton = new ControlButton('media-skip-forward', buttonsize,
            Lang.bind(this, function () { 
        }));

        this._spaceButtonTwo = new St.Bin({style_class: 'spaceb'});

        this._settButton = new ControlButton('system-run', Math.floor(buttonsize * 0.8),
            Lang.bind(this, function () { 
            }));

        this.controls = new St.BoxLayout();

        if (openbutton == "raise") {
            this.controls.add_actor(this._raiseButton.getActor());
            this.controls.add_actor(this._spaceButton);
        }

        this.controls.add_actor(this._prevButton.getActor());
        this.controls.add_actor(this._playButton.getActor());
        this.controls.add_actor(this._nextButton.getActor());

        if (openbutton == "preferences" && has_gsettings_schema) {
            this.controls.add_actor(this._spaceButtonTwo);
            this.controls.add_actor(this._settButton.getActor());
        }

        this._trackControlHolder.set_child(this.controls);

       
    },

    getActor: function() {
        return this.actor;
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

            this._cbox = new St.BoxLayout();

            this._mainMusicBox = new MusicIntBox("", 120, 26, true, "raise", "");

            // END OF CONTROL BOX ########################################
            this._cbox.add(this._mainMusicBox.getActor());
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
