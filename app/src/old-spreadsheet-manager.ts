

import * as fs from 'fs';
// import { ApplicationMenu } from './menu';
import { remote } from 'electron';

const { dialog } = remote;

declare type SheetCallback = (sheet: any) => void;

/**
 * wrapper for embedded spreadsheet. basically just adds file functions,
 * since electron has direct filesystem access.
 *
 * singleton (use factory method).
 */
export class SpreadsheetManager {

  public static RESIZE_TIMEOUT = 50;

  public static LOCAL_STORAGE_KEY = 'editor-path';

  /** factory method */
  public static CreateInstance(container: HTMLElement): SpreadsheetManager {
    const instance = new SpreadsheetManager(container);

    // ...

    return instance;
  }

  /** dirty flag, cleared on save/close/new */
  public dirty = false;

  /** path of current open document */
  public current_path = '';

  protected sheet: EmbeddedSheet;

  protected resize_token?: any;

  protected constructor(container: HTMLElement) {

    // primary node
    // const container = document.querySelector('.main-container') as HTMLElement;

    this.sheet = TREB.CreateSpreadsheet({
      container,
      formula_bar: true,
      tab_bar: true,
      add_tab: true,
      delete_tab: true,
      mc: true,
      expand: true,
      toolbar: 'show',
      expand_formula_button: true,
      resizable: false,
      popout: false,
      collapsed: true,
      dnd: true,
      max_workers: 4,
      chart_menu: true,
    });

    // enable toolbar, toggled off by default
    // this.sheet.FormattingToolbar(node);

    // dev
    // (self as any).sheet = this.sheet;

    console.group('setting accessors in console:');
    console.table({
      sheet: { value: 'the embedded spreadsheet'},
      grid: { value: 'the grid object'},
      model: { value: 'the data model' },
      active_sheet: { value: 'the active sheet'},
      row_pattern: { value: 'row pattern style in the active sheet'},
    });
    console.groupEnd();
    console.info('');

    console.group('some useful methods:');
    console.table({
      Sheets: { value: 'apply a method to all sheets: model.sheets.map(s => func)' },
      Save: { value: 'save sheet (even if we don\'t think it\'s dirty' },
    });
    console.groupEnd();
    console.info('');

    Object.defineProperties(self, {
      sheet: { get: () => this.sheet, },
      grid: { get: () => (this.sheet as any).grid, },
      model: { get: () => (this.sheet as any).grid.model, },
      active_sheet: { get: () => (this.sheet as any).grid.active_sheet, },
      row_pattern: { get: () => (this.sheet as any).grid.active_sheet.row_pattern, },
    });

    (self as any).Save = () => this.SaveFile();
    (self as any).Sheets = (fun: SheetCallback) => {
      (this.sheet as any).grid.model.sheets.forEach((sheet: any) => fun(sheet));
    };

    this.LoadLastDocument().then(() => {

      // DEV // this.InitMenu();

      // last: subscribe to sheet events, update dirty flag

      this.sheet.Subscribe((event: any) => {
        switch (event.type) {
          case 'data':
          case 'document-change':
            if (!this.dirty) {
              this.dirty = true;
              // DEV // ApplicationMenu.UpdateFileMenu(this.current_path, this.dirty);
            }
            break;
        }
      });

    });

    window.addEventListener('resize', () => {
      if (!this.resize_token) {
        this.resize_token = setTimeout(() => {
          this.resize_token = undefined;
          this.sheet.Resize();
        }, SpreadsheetManager.RESIZE_TIMEOUT)
      }
    });

    const mask = document.querySelector('.dialog-mask');
    const properties_dialog = document.querySelector('.document-properties');
    
    if (properties_dialog) {

      const name = document.querySelector('#document-properties-title') as HTMLInputElement;

      name.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          mask?.classList.remove('active');
        }
        else if (event.key === 'Enter') {
          mask?.classList.remove('active');
        }
        else {
          return;
        }
        event.stopPropagation();
        event.preventDefault();
      });

      properties_dialog.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target && /button/i.test(target.tagName)) {
          if (target.classList.contains('dialog-ok')) {
            if (name) {
              this.sheet.document_name = name.value.trim();
            }
          }
          mask?.classList.remove('active');
        }
      });

    }

  }

  /* * set up menu * /
  public InitMenu() {

    // set up menu
    ApplicationMenu.Init();
    ApplicationMenu.UpdateFileMenu(this.current_path, this.dirty);
    ApplicationMenu.Subscribe((event) => {

    let result: Promise<void> | undefined;

    switch (event) {
      case 'new':
        this.New();
        break;

      case 'revert':
        result = this.RevertFile();
        break;

      case 'open':
        result = this.LoadFile();
        break;

      case 'save':
        result = this.SaveFile();
        break;

      case 'save-as':
        result = this.SaveAs();
        break;

      case 'about':
        this.About();
        return;

      case 'properties':
        this.Properties();
        return;
        
      default:
        console.warn('unhandled menu event: ' + event);
        return;
    }

    (result || Promise.resolve()).then(() => {
      ApplicationMenu.UpdateFileMenu(this.current_path, this.dirty);
    });

  });

  }
  */

  /**
   * load last document, if any; this is separate from constructor
   * because load is async
   */
  public async LoadLastDocument() {

    // load last document, if any
    const stored_path = localStorage.getItem(SpreadsheetManager.LOCAL_STORAGE_KEY);
    if (stored_path) {
      try {
        await this.LoadFile(stored_path);
      }
      catch(e) {
        console.warn('load last document failed');
        console.error(e);
      }
    }

  }

  /** pass-through for sheet events */
  public Subscribe(callback: (event: any) => void) {
    this.sheet.Subscribe(callback);
  }

  /** new file */
  public New() {
    this.current_path = '';
    this.sheet.Reset();
    this.dirty = false;
    localStorage.removeItem(SpreadsheetManager.LOCAL_STORAGE_KEY);
  }

  public Properties() {
    const name = document.querySelector('#document-properties-title') as HTMLInputElement;
    name.value = this.sheet.document_name || '';

    const mask = document.querySelector('.dialog-mask');
    mask?.classList.add('active');
    name?.focus();
    name?.select();

  }

  public About() {
    alert(`TREB version ${(self as any).TREB.version}`)
  }

  public async RevertFile() {
    if (!this.current_path) {
      throw new Error('no file to revert');
    }
    await this.LoadFile(this.current_path);
  }

  public async LoadFile(file?: string) {

    if (!file) {
      const result = await dialog.showOpenDialog({});
      if (result.filePaths && result.filePaths.length && result.filePaths[0]) {
        await this.LoadFile(result.filePaths[0]);
      }
    }
    else {
      await new Promise<void>((resolve, reject) => {
        fs.readFile(file, { encoding: 'utf8' }, (err, data) => {
          if (err) {
            return reject(err);
          }
          this.dirty = false;
          this.current_path = file;
          localStorage.setItem(SpreadsheetManager.LOCAL_STORAGE_KEY, this.current_path);
          if (/csv$/i.test(file)) {
            this.sheet.LoadCSV(data);
          }
          else {
            this.sheet.LoadDocument(JSON.parse(data));
          }
          resolve();
        });
      });
    }

  }

  public async SaveAs() {
    const result = await dialog.showSaveDialog({
      filters: [
        { name: 'TREB files', extensions: ['treb']},
      ],
    });
    if (result && result.filePath) {
      this.current_path = result.filePath;
      await this.SaveFile();
      localStorage.setItem(SpreadsheetManager.LOCAL_STORAGE_KEY, this.current_path);
    }
  }

  public async SaveFile() {

    if (!this.current_path) {
      // throw new Error('missing path');
      return this.SaveAs();
    }

    const serialized = this.sheet.SerializeDocument(true);
    const json = JSON.stringify(serialized);

    await new Promise<void>((resolve) => {
      fs.writeFile(this.current_path, json, {encoding: 'utf8'}, (err) => {
        if (err) {
          throw new Error(err as any);
        }
        this.dirty = false;
        resolve();
      });
    });

  }

}
