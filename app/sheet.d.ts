
declare class EmbeddedSheet {
  RunSimulation: (trials?: number) => void;
  Reset: () => void;
  LoadLocalFile: () => void;
  SaveLocalFile: () => void;
  Undo: () => void;
  Resize: () => void;
  Focus: () => void;
  GetSelection: () => string|undefined;
  SimulationData: (address: string) => any;
  Recalculate: () => void;
  LoadDocument: (document: any, scroll?: string) => void;
  LoadCSV: (content: string) => void;
  ScrollTo: (address: string) => void;
  ApplyStyle: (style: any, delta?: boolean) => void;
  Subscribe: (subscriber: (event: any) => void) => void;
  LoadNetworkDocument: (uri: string) => void;
  Export: () => void;
  GetUserData: () => any;
  UpdateTheme: () => void;
  SetUserData: (data: any) => void;
  FlushSimulationResults: () => void;
  GetRange: (address: string) => any[][];
  FormattingToolbar: (node: HTMLElement) => void;
  InsertAnnotation: (type: string) => void;
  SerializeDocument: (include_simulation_data: boolean) => unknown;
  options: any;
  document_name?: string;
  user_data?: any;
}

declare interface EmbeddedSheetOptions {
  storage_key?: string;
  formula_bar?: boolean;
  in_cell_editor?: boolean;
  popout?: boolean;
  expand?: true,
  global_name?: string;
  undo?: boolean;
  mc?: boolean;
  toolbar?: boolean|'show';
  toolbar_recalculate_button?: boolean;
  expand_formula_button?: boolean;
  dnd?: boolean;
  delete_tab?: boolean;
  tab_bar?: boolean|'auto';
  add_tab?: boolean;
  scroll?: string;
  collapsed?: boolean;
  container: Element;
  resizable?: boolean;
  network_document?: string;
  decorated?: boolean;
  max_workers?: number;
  chart_menu?: boolean;
  scale_control?: boolean;
  persist_scale?: boolean;
}
