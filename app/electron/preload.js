const { contextBridge, ipcMain, ipcRenderer } = require("electron");
const Subscribe = require('./menu').Subscribe;

const fs = require("fs");
// const i18nextBackend = require("i18next-electron-fs-backend");
const Store = require("secure-electron-store").default;
// const ContextMenu = require("secure-electron-context-menu").default;
// const SecureElectronLicenseKeys = require("secure-electron-license-keys");

// Create the electron store to be made available in the renderer process
const store = new Store();

const subscriptions = [];
ipcRenderer.addListener('menu', (...args) => {
  Promise.resolve().then(() => {
    for (const subscription of subscriptions) {
      subscription(...args);
    }
  });
});

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  // i18nextElectronBackend: i18nextBackend.preloadBindings(ipcRenderer),
  store: store.preloadBindings(ipcRenderer, fs),
  // contextMenu: ContextMenu.preloadBindings(ipcRenderer),
  // licenseKeys: SecureElectronLicenseKeys.preloadBindings(ipcRenderer),

  theme: {
    toggle: () => ipcRenderer.invoke('dark-mode:toggle'),
    system: () => ipcRenderer.invoke('dark-mode:system'),
  },

  menu: {
    subscribe: (fn) => subscriptions.push(fn),
    update: (data) => ipcRenderer.invoke('menu', data),
  },

  files: {
    save: (path) => { console.info('save!', path) },
    open: async (path) => { 
      return  ipcRenderer.invoke('fs', { type: 'open', path });
    },
  }

});
