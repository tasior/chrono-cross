
module CC {
    
    export class Battlefield {
        private _reader;
        private _loaded = false;
        
        mesh : Object;
        
        constructor(reader : DrpReader) {
            this._reader = reader;
        }
        
        load(vram : any) {
            if(!this._loaded) {
                this._loadTextures(vram);
            
                this.mesh = this._loadMeshes();
                
                this._loaded = true;
            }
            
            return this;
        }
        
        private _loadTextures(vram : any) {
            var drp = this._reader.read();
            
            drp.entries.filter((e) => { return e.type == 0x04;  }).forEach((entry) => {
                vram.readTIM( this._reader.file(entry.offset, entry.length) );
            });
        }
        
        private _loadMeshes() {
            var drp = this._reader.read(),
                mesh = {};
            
            drp.entries.filter((e) => { return e.type == 0x02 || e.type == 0x12; }).forEach((entry) => {
                console.log(entry);
                var name = entry.name;
                if(mesh[entry.name]) {
                    console.warn('exist', entry.name);
                    name += Date.now();
                }
                mesh[name] =  new MeshReader( this._reader.file(entry.offset, entry.length) ).read();
            });
            
            return mesh;
        }
    }
    
}