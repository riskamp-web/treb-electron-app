
/**
 * we're passing this object through to the dialog call; note that
 * binary objects, like icon, won't pass through the interop boundary.
 * 
 * https://www.electronjs.org/docs/api/dialog#dialogshowmessageboxbrowserwindow-options
 */
export interface ModalOptions {
  message?: string;
  detail?: string;
  buttons?: string[];
  
  /** there are other types, see the electron docs */
  type?: 'info'|'question'|'error'|'warning'|'none';
}

export interface ModalResult {
  response: number;
  checkboxChecked?: boolean;
}

export interface MenuUpdateOptions {
  save_enabled?: boolean;
  revert_enabled?: boolean;
  menu_enabled?: boolean;
  treb_version?: string;
}

export interface OpenFileData {
  path: string,
  data: any,
  name: string,
}

export interface InteropAPI {

  modal: {
    /** 
     * show modal dialog for confirm/alert. 
     * 
     * just FYI you can call the standard browser confirm/alert methods, and 
     * they work, but then the window stops receiving keyboard events. so not
     * optimal. not sure if that is documented anywhere.
     */
    Show: (options: ModalOptions) => Promise<ModalResult>,
  },

  menu: {
    /**
     * update menu: update text, options
     */
    Update: (options: MenuUpdateOptions) => void,

    /**
     * subscribe to menu events
     */
    Subscribe: (handler: (event: any, command: string) => Promise<void>) => void,
  },

  files: {

    /**
     * show the open file dialog
     */
    Open: (path?: string) => Promise<OpenFileData>,
  },

  theme: {

    /**
     * toggle light/dark
     */
    Toggle: () => Promise<void>,
  },

}

