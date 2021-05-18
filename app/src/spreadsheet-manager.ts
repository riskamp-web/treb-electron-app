

interface DocumentMetadata {

  /** document path, if it came from the filesystem */
  path?: string;

  /** document name */
  name?: string;

  /** placeholder if we don't have a document name */
  placeholder?: string;

  /**
   * we have a slightly different concept of "dirty" than the spreadsheet
   * itself. as far as the spreadsheet is concerned, as long as it's saved 
   * somewhere it is not dirty. for this application, "dirty" means not saved
   * to the filesystem, so a document in localStorage can be dirty even though
   * we are persisting it.
   */
  dirty?: boolean;

}

export class SpreadsheetManager {

  public spreadsheet?: EmbeddedSheet;
  public container?: HTMLElement;
  public metadata: DocumentMetadata = {};

  private static storage_key = 'document-data';

  constructor(container?: HTMLElement) {
    if (container) {
      this.Init(container);
    }
  }

  /** pass-through for reset */
  public Reset() {
    this.spreadsheet?.Reset();
    /*
    this.metadata = {
      placeholder: 'New document',
    }; // no path, no saved version
    this.UpdateTitle();
    */
  }

  /** pass-through for document */
  public LoadDocument(data: any, path = '', name?: string) {

    if (/xls[xm]$/i.test(path)) {
      // ...
      console.info("X");
      (this.spreadsheet as any).ImportXLSX(data);
    }
    else if (/[ct]sv$/i.test(path)) {
      console.info('opening as CSV');
      this.spreadsheet?.LoadCSV(data);
      this.metadata = {
        path,
        name,
      };
    }
    else {
      console.info('opening as TREB/JSON');
      const doc = JSON.parse(data);
      this.spreadsheet?.LoadDocument(doc);
      this.metadata = {
        path,
        name,
      };
    }

    this.CheckDirty();
    this.UpdateTitle();

  }

  public UpdateTheme() {
    this.spreadsheet?.UpdateTheme();
  }

  public CheckDirty() {

    const dirty = ((this.spreadsheet as any)?.file_version) !== ((this.spreadsheet as any)?.last_save_version);
    // console.info('sheet dirty', sheet_dirty);
    // const version = (this.spreadsheet as any)?.file_version; // FIXME: need accessor
    // const dirty = version !== this.metadata.saved_version;

    if (dirty !== !!this.metadata.dirty) {
      this.metadata.dirty = dirty;
      this.UpdateTitle();

      (self as any).api.menu.update({
        save_enabled: dirty,
        revert_enabled: dirty && !!this.metadata.path,
      });

    }

  }

  public ConfirmChanges() {
    if (this.metadata.dirty) {
      return confirm('Document has unsaved changes, are you sure?');
    }
    return true;
  }

  /** update the window title based on document name, state */
  public UpdateTitle() {

    const text: string[] = ['TREB'];

    if (this.metadata.name) {
      text.push(': ');
      text.push(this.metadata.name);
    }
    else if (this.metadata.placeholder) {
      text.push(': ');
      text.push(this.metadata.placeholder);
    }

    if (this.metadata.dirty) {
      text.push(' *');
      // text.push(' ⚑');
    }

    document.title = text.join('');

  }

  /** pass through to spreadsheet */
  public SelectAll() {
    (this.spreadsheet as any)?.grid.SelectAll();
  }

  /** pass through to spreadsheet */
  public Undo() {
    this.spreadsheet?.Undo();
  }

  public Init(container: HTMLElement) {

    const stored_data = localStorage.getItem(SpreadsheetManager.storage_key);

    this.container = container;
    this.spreadsheet = TREB.CreateSpreadsheet({
      container,
      mc: true,
      dnd: true,
      collapsed: true,
      expand: true,
      expand_formula_button: true,
      resizable: false,
      toolbar: 'show',
      toolbar_recalculate_button: true,
      add_tab: true,
      delete_tab: true,
      tab_bar: true,
      scale_control: true,
      persist_scale: true,

      // since we are storing separate metadata anyway, we don't use the 
      // spreadsheet's default storage mechanism (it would just be redundant)

      // storage_key: 'current-document',
      global_name: 'sheet',

    });

    // restore document, if available

    if (stored_data) {
      try {
        const data = JSON.parse(stored_data);
        if (data && data.document) {
          this.spreadsheet.LoadDocument(data.document);
        }
        if (data && data.metadata) {
          this.metadata = {...data.metadata};

          // this is a little bit of a hack to preserve dirty state of open 
          // documents, if something was preserved in localstorage before it 
          // was saved

          if (this.metadata.dirty) {
            (this.spreadsheet as any).last_save_version = 
              (this.spreadsheet as any).file_version - 1;
          }

        }

      }
      catch (err) {
        console.info('error restoring document/metadata');
        console.error(err);
      }
    }

    this.UpdateTitle();

    (self as any).api.menu.update({
      save_enabled: !!this.metadata.dirty,
      revert_enabled: this.metadata.dirty && !!this.metadata.path,
    });
    
    // save document/metadata on close 

    window.onbeforeunload = () => {
      localStorage.setItem(SpreadsheetManager.storage_key, JSON.stringify({
        document: this.spreadsheet?.SerializeDocument(false),
        metadata: this.metadata,
      }));
    };

    // disable the menu when a modal dialog is shown

    const original_dialog_handlers = {
      ShowDialog: (this.spreadsheet as any).dialog.ShowDialog,
    };

    (this.spreadsheet as any).dialog.ShowDialog = async (...args: any[]) => {
      (self as any).api.menu.update({menu_enabled: false});
      const result = await original_dialog_handlers.ShowDialog.apply((this.spreadsheet as any).dialog, args);
      (self as any).api.menu.update({menu_enabled: true});
      return result;
    };

    // handle spreadsheet events

    this.spreadsheet.Subscribe(event => {
      switch (event.type) {
        case 'selection':
        case 'data':
        case 'simulation-progress':
        case 'resize':
          return;

        case 'reset':
          this.metadata = {
            placeholder: 'New document',
          };
          this.CheckDirty();
          this.UpdateTitle();
          break;

        case 'document-change':
          this.CheckDirty();
          break;

        case 'load':
          if (event.source === 'undo') {
            this.CheckDirty();
          }
          else if (event.source === 'drag-and-drop') {
            this.metadata = {
              placeholder: 'Imported document',
            };
            this.CheckDirty();
            this.UpdateTitle();
          }
          break;
      }

      console.info(event);

    });

    // on window resize, update layout

    let resize_token: number | NodeJS.Timeout | undefined;

    window.addEventListener('resize', () => {
      if (!resize_token) {
        resize_token = setTimeout(() => {
          this.spreadsheet?.Resize();
          resize_token = undefined;
        }, 100);
      }
    });

  }

}