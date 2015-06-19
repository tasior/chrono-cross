
module Core {
    
    export class BinaryFileReader {
        
        constructor(public file : File) { }
        
        read(offset : number, length : number, callback : (buffer : ArrayBuffer) => any) {
            
            var fileReader = new FileReader();
            fileReader.onloadend = (event : Event) => {
                callback((<FileReader> event.target).result);
            };
            fileReader.readAsArrayBuffer(this.file.slice(offset, offset + length));
            
        }
        
    }
    
}