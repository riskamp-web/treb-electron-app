
import './new.scss';
import './dark-theme.scss';

import { InteropAPI, OpenFileData } from './remote-api';
declare const api: InteropAPI;

import { SpreadsheetManager } from './spreadsheet-manager'; 

const spreadsheet_manager = new SpreadsheetManager(document.querySelector('#target') as HTMLElement);

// the target here is ephemeral so use an accessor
Object.defineProperty(self, 'metadata', {
  get: () => spreadsheet_manager.metadata,
});

Object.defineProperty(self, 'spreadsheet_manager', {
  get: () => spreadsheet_manager,
});

api.menu.Update({ 
  treb_version: TREB.version,
  menu_enabled: true,
});

const LoadFromData = (result?: OpenFileData) => {
  if (result) {
    console.info(result);
    if (result.data) {
      spreadsheet_manager.LoadDocument(result.data, result.path, result.name);
    }
    document.title = result.name ? `TREB: ${result.name}` : 'TREB';
  }
};

api.menu.Subscribe(async (event: any, command: string) => {
  switch (command) {
    case 'new':
      if (await spreadsheet_manager.ConfirmChanges('Click OK to discard your changes and create a new document')) {
        spreadsheet_manager.Reset();
        document.title = 'TREB'; // could be handled by reset event instead
      }
      break;

    case 'revert':
      if (await spreadsheet_manager.ConfirmChanges('Click OK to discard your changes and revert to the last saved version')) {
        LoadFromData(await api.files.Open(spreadsheet_manager.metadata.path));
      }
      break;

    // case 'save':
    //  window.confirm("Are you sure?");
    //  break;

    case 'open':
      LoadFromData(await api.files.Open());
      /*
      const result = await api.files.open();
      if (result) {
        console.info(result);
        if (result.data) {
          spreadsheet_manager.LoadDocument(
            result.data, result.path, result.name);
        }
        document.title = result.name ? `TREB: ${result.name}` : 'TREB';
      }
      */
      break;

    case 'toggle-theme':
      api.theme.Toggle().then(() => { 
        spreadsheet_manager.UpdateTheme();
      });
      break;

    case 'select-all':
      spreadsheet_manager.SelectAll();
      break;

    case 'undo':
      spreadsheet_manager.Undo();
      break;

    default:
      console.info('unhandled menu command', command);
  }
});
