const ArLiveDrawDefaultOptions = { 
    sourceType: 'webcam',
    sourceUrl: undefined,
    cameraParametersUrl: 'data/camera_para.dat',
    detectionMode: 'mono',
    patternRatio: .5,
    patternUrl: 'data/hiro.patt',
    imageSmoothingEnabled : true
}

class ArLiveDraw {
    constructor(scene, camera, options) {
        this.scene = scene;
        this.camera = camera;
        this.options = options || defaultOptions;
        this.liveDrawn = [];
        this.arToolkitSource = new THREEx.ArToolkitSource({
            sourceType: this.options.sourceType || ArLiveDrawDefaultOptions.sourceType,
            sourceUrl: this.options.sourceUrl || ArLiveDrawDefaultOptions.sourceUrl
        });
        this.arToolkitSource.init();

        this.arToolkitContext = new THREEx.ArToolkitContext({
            cameraParametersUrl: this.options.cameraParametersUrl || ArLiveDrawDefaultOptions.cameraParametersUrl,
            detectionMode: this.options.detectionMode || ArLiveDrawDefaultOptions.detectionMode,
            patternRatio: this.options.patternRatio || ArLiveDrawDefaultOptions.patternRatio,
            imageSmoothingEnabled : this.options.imageSmoothingEnabled || ArLiveDrawDefaultOptions.imageSmoothingEnabled
        });

        var thisArLiveDraw = this;
        
        this.arToolkitContext.init(function onCompleted() {
            thisArLiveDraw.camera.projectionMatrix.copy(thisArLiveDraw.arToolkitContext.getProjectionMatrix());
        });

        this.markerRoot = new THREE.Group();
        scene.add(this.markerRoot);

        let markerControls = new THREEx.ArMarkerControls(this.arToolkitContext, this.markerRoot, {
            type: 'pattern',
            patternUrl: this.options.patternUrl || ArLiveDrawDefaultOptions.patternUrl,
        });
        this.smoothedRoot = new THREE.Group();
        
        scene.add(this.smoothedRoot);
        this.smoothedControls = new THREEx.ArSmoothedControls(this.smoothedRoot, {
            lerpPosition: 0.8,
            lerpQuaternion: 0.8,
            lerpScale: 1,
            // minVisibleDelay: 1,
            // minUnvisibleDelay: 1,
        });
    }
    addLiveDrawnMesh(mesh, planeTexureCoordinates) {
        let texture = new THREE.VideoTexture(this.arToolkitSource.domElement);
        
        texture.minFilter = THREE.LinearFilter;
        mesh.material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.FrontSide
        });
        this.liveDrawn.push({
            coords: planeTexureCoordinates,
            mesh: mesh
        });
        return mesh;
    }
    getMarkerGroup() {
        return this.smoothedRoot;
    }
    update() {
        if (this.arToolkitSource.ready !== false) {
            this.arToolkitContext.update(this.arToolkitSource.domElement);
        }
        this.smoothedControls.update(this.markerRoot);
        for(var i=0; i<this.liveDrawn.length; i++) {
            let mesh = this.liveDrawn[i].mesh;
            
            if(mesh.visible) {
                let coords = this.liveDrawn[i].coords;
                
                for(var j = 0; j<coords.length; j++) {
                    for(var k = 0; k<coords[j].length; k++) {
                        var vector = new THREE.Vector3(
                            coords[j][k][0], 
                            0, 
                            coords[j][k][1]
                        );
                        this.markerRoot.localToWorld(vector);
                        vector.project(camera);
                        mesh.geometry.faceVertexUvs[0][j][k].set(
                            ( vector.x + 1 ) * .5, 
                            ( vector.y + 1 ) * .5
                        );
                    }
                }
                mesh.geometry.uvsNeedUpdate = true;
            }    
        }
    }
}
