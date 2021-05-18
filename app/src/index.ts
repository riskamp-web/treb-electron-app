
import './new.scss';
import './dark-theme.scss';

import { SpreadsheetManager } from './spreadsheet-manager'; 

const spreadsheet_manager = new SpreadsheetManager(document.querySelector('#target') as HTMLElement);

// the target here is ephemeral so use an accessor
Object.defineProperty(self, 'metadata', {
  get: () => spreadsheet_manager.metadata,
});

(self as any).api.menu.update({ 
  treb_version: TREB.version,
  menu_enabled: true,
});

(self as any).api.menu.subscribe(async (event: any, command: string) => {
  switch (command) {
    case 'new':
      if (spreadsheet_manager.ConfirmChanges()) {
        spreadsheet_manager.Reset();
        document.title = 'TREB'; // could be handled by reset event instead
      }
      break;

    // case 'save':
    //  window.confirm("Are you sure?");
    //  break;

    case 'open':
      const result = await (self as any).api.files.open();
      if (result) {
        console.info(result);
        if (result.data) {
          spreadsheet_manager.LoadDocument(
            result.data, result.path, result.name);
        }
        document.title = result.name ? `TREB: ${result.name}` : 'TREB';
      }
      break;

    case 'toggle-theme':
      (self as any).api.theme.toggle().then(() => { 
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
