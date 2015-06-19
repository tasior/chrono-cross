
module Core {
    
    export class FileDialog {
        private _input : HTMLInputElement;
        
        constructor() {
            this._input = document.createElement('input');
            this._input.setAttribute('type', 'file');
        }
        
        open(callback: (file: File) => any) {
            this._input.onchange = (event: Event) => {
                event.preventDefault();
                
                callback((<HTMLInputElement> event.target).files[0]);
            }
            this._input.click();
        }
    }
    
}