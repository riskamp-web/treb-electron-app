const { Menu, MenuItem, BrowserWindow, ipcMain, nativeTheme } = require("electron");
const build = require('../../package.json');

// const i18nBackend = require("i18next-electron-fs-backend");
// const whitelist = require("../localization/whitelist");
const isMac = process.platform === "darwin";

/**
 * menu state can be updated at runtime by the renderer process.
 */
const menu_state = {
  treb_version: '',
  save_enabled: false,
  revert_enabled: false,
  menu_enabled: true,
};

const MenuBuilder = function(mainWindow, appName, callback) {

  // https://electronjs.org/docs/api/menu#main-process
  const defaultTemplate = function() {
    return [
      // { role: "appMenu" }
      ...(isMac
        ? [
            {
              label: appName,
              submenu: !menu_state.menu_enabled ? undefined : [
                {
                  role: "about",
                  label: ("About")
                },
                {
                  type: "separator"
                },
                {
                  role: "services",
                  label: ("Services")
                },
                {
                  type: "separator"
                },
                {
                  role: "hide",
                  label: ("Hide")
                },
                {
                  role: "hideothers",
                  label: ("Hide Others")
                },
                {
                  role: "unhide",
                  label: ("Unhide")
                },
                {
                  type: "separator"
                },
                {
                  role: "quit",
                  label: ("Quit")
                }
              ]
            }
          ]
        : []),
      // { role: "fileMenu" }
      {
        label: ("File"),
        submenu: !menu_state.menu_enabled ? undefined : [
          {
            label: "New Document",
            click: () => callback("new"),
          },
          
          {
            type: "separator",
          },

          {
            label: "Open...",
            click: () => callback("open"),
          },
          {
            label: "Save",
            click: () => callback("save"),
            enabled: menu_state.save_enabled,
          },
          {
            label: "Save as...",
            click: () => callback("save-as"),
          },
          {
            label: "Revert",
            click: () => callback("revert"),
            enabled: menu_state.revert_enabled,
          },
          {
            type: "separator",
          },
          isMac
            ? {
                role: "close",
                label: ("Quit")
              }
            : {
                role: "quit",
                label: ("Exit")
              }
        ]
      },
      // { role: "editMenu" }
      {

        // in the edit menu we can rely on standard event routing
        // for cut, copy, and paste, but not for undo, delete or 
        // select-all. so we need to handle those ourselves.

        label: ("Edit"),
        submenu: !menu_state.menu_enabled ? undefined : [
          {
            // role: "undo",
            label: ("Undo"),
            click: () => callback("undo"),
            accelerator: 'CmdOrCtrl+Z',
          },
          /*
          {
            role: "redo",
            label: ("Redo")
          },
          */
          {
            type: "separator"
          },
          {
            role: "cut",
            label: ("Cut")
          },
          {
            role: "copy",
            label: ("Copy")
          },
          {
            role: "paste",
            label: ("Paste")
          },
          ...(isMac
            ? [
                /*
                {
                  role: "pasteAndMatchStyle",
                  label: ("Paste and Match Style")
                },
                */
                {
                  //role: "delete",
                  label: ("Delete"),
                  click: () => callback("delete"),
                  accelerator: 'Delete',
                },
                {
                  //role: "selectAll",
                  label: ("Select All"),
                  click: () => callback("select-all"),
                  accelerator: 'CmdOrCtrl+A',
                },
                {
                  type: "separator"
                },
                /*
                {
                  label: ("Speech"),
                  submenu: [
                    {
                      role: "startspeaking",
                      label: ("Start Speaking")
                    },
                    {
                      role: "stopspeaking",
                      label: ("Stop Speaking")
                    }
                  ]
                }
                */
              ]
            : [
                {
                  //role: "delete",
                  label: ("Delete"),
                  click: () => callback("delete"),
                  accelerator: 'Delete',
                },
                {
                  type: "separator"
                },
                {
                  //role: "selectAll",
                  label: ("Select All"),
                  click: () => callback("select-all"),
                  accelerator: 'CmdOrCtrl+A',

                }
              ])
        ]
      },
      // { role: "viewMenu" }
      {
        label: ("View"),
        submenu: !menu_state.menu_enabled ? undefined : [
          {
            label: 'Dark Theme', 
            type: 'checkbox',
            checked: nativeTheme.shouldUseDarkColors,
            click: () => callback('toggle-theme'),
          },
          {
            type: 'separator',
          },
          {
            role: "reload",
            label: ("Reload")
          },
          {
            role: "forcereload",
            label: ("Force Reload")
          },
          {
            role: "toggledevtools",
            label: ("Toggle Developer Tools")
          },
          /*
          {
            type: "separator"
          },
          {
            role: "resetzoom",
            label: ("Reset Zoom")
          },
          {
            role: "zoomin",
            label: ("Zoom In")
          },
          {
            role: "zoomout",
            label: ("Zoom Out")
          },
          */
          {
            type: "separator"
          },
          {
            role: "togglefullscreen",
            label: ("Toggle Fullscreen")
          }
        ]
      },
      /*
      // language menu
      {
        label: ("Language"),
        submenu: whitelist.buildSubmenu(i18nBackend.changeLanguageRequest, i18nextMainBackend)
      },
      */
      // { role: "windowMenu" }
      {
        label: ("Window"),
        submenu: !menu_state.menu_enabled ? undefined : [
          {
            role: "minimize",
            label: ("Minimize")
          },
          /*
          {
            role: "zoom",
            label: ("Zoom")
          },
          */
          ...(isMac
            ? [
                {
                  type: "separator"
                },
                {
                  role: "front",
                  label: ("Front")
                },
                {
                  type: "separator"
                },
                {
                  role: "window",
                  label: ("Window")
                }
              ]
            : [
                {
                  role: "close",
                  label: ("Close")
                }
              ])
        ]
      },
      {
        role: "help",
        label: ("Help"),
        submenu: !menu_state.menu_enabled ? undefined : [
          {
            label: `TREB version ${menu_state.treb_version}`,
            enabled: false,
          },
          {
            label: `TREB/Electron version ${build.version}`,
            enabled: false,
          },
          {
            type: 'separator',
          },
          {
            label: ("Learn More"),
            click: async () => {
              const { shell } = require("electron");
              await shell.openExternal("https://electronjs.org");
            }
          }
        ]
      }
    ];
  };

  return {

    BuildMenu: () => {
      const menu = Menu.buildFromTemplate(defaultTemplate());
      Menu.setApplicationMenu(menu);
      return menu;
    },

    UpdateMenu: (data) => {

      if (data.treb_version) {
        menu_state.treb_version = data.treb_version;
      }

      if (data.save_enabled !== undefined) {
        menu_state.save_enabled = data.save_enabled;
      }

      if (data.revert_enabled !== undefined) {
        menu_state.revert_enabled = data.revert_enabled;
      }

      if (data.menu_enabled !== undefined) {
        menu_state.menu_enabled = data.menu_enabled;
      }

      const menu = Menu.buildFromTemplate(defaultTemplate());
      Menu.setApplicationMenu(menu);

    },

  };
};

module.exports = MenuBuilder;
