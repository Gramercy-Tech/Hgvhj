'use strict';
import  { THREE } from 'three';
const OrbitControls = require("three-orbit-controls")(THREE);

let atsApp = {
  touchText: undefined,
  textureLoader: new THREE.TextureLoader(),
  currentMode: "touchText",
  popUpActive: false,
  time: Date.now(),
  touchTextCycleLength: 1000 * 11,
  touchTextFade: 1000 * 3,
  touchTextGrow: 1000 * 5,
  touchTextZ: 80,
  attractionOffset: 0,
  fadeDuration: 1000 * 0.3,
  reverseSproutDuration: 1000 * 0.5,
  reverseRootSproutDuration: 1000 * 1.25,
  sproutDuration: 1000 * 4.0,
  rootSproutDuration: 1000 * 6.0,
  numOscillations: 6,
  rootClickDuration: 1000 * 3,
  bounce: 10,
  //maxIdleTime: (+FlowRouter.getQueryParam("t") || 120) * 1000,
  goToTouchTextTimeout: undefined,
  //cameraMoveDuration: 1000 * 1.0,
  cameraMoveDuration: 1000 * 3.0,
  //phaseDistance: 280,
  phaseDistance: 370,
  moleculeDistance: 230,
  moleculeScale: 120,
  phaseScale: 130,
  rootScale: 140,
  linewidth: 1,
  //cameraDistance: +FlowRouter.getQueryParam("d") || 820,
  cameraDistance: +FlowRouter.getQueryParam("d") || 820,
  //cameraDistanceFactor: 1.2,
  cameraDistanceFactor: 1.2,
  //focalLength: 13,
  focalLength: 12,
  outerColor: [252/255, 175/255, 23/255],
  innerColor: [134/255, 0/255, 82/255],
  raycaster: new THREE.Raycaster(),
  mouse: new THREE.Vector2(),
  tweens: {},
  phases: [],
  molecules: [],
  textures: {},
  tweenEasing: TWEEN.Easing.Elastic.Out,
  moleculeAttributes: ['asthma', 'copd', 'large', 'small'],
  controlsEnabled: true,
  currentFilter: {
    size:undefined, 
    disease: undefined,
  },
  cameraTarget: new THREE.Vector3(0,0,0),
  handleClick: function(event){
    TWEEN.removeAll();
    this.clearTouchTextRootAnimationCycle();
    switch (this.currentMode){
      case "touchText":
      this.reset();
      this.runRootMode(event);
      break;
      case "root":
      this.handleRootClick(event);
      this.highlightFilteredMolecules();
      break;
      case "molecule":
      //this.handleMoleculeClick(event);
      break;
    }
  },
  setIdleTimeout(){
    if(this.goToTouchTextTimeout !== undefined){
      Meteor.clearTimeout(this.goToTouchTextTimeout);
    }
    this.goToTouchTextTimeout = Meteor.setTimeout( () => {
      this.reset();
      this.runTouchTextMode();
      this.rootGroup.position.set(0,0,0);
    }, this.maxIdleTime);
  },
  handleRootClick(event){
    this.setBoomerangOpacity(1.0);
    let coordinates = this.mouseToScene([event.clientX, event.clientY]);
    this.mouse.x = coordinates[0] / window.innerWidth * 2;
    this.mouse.y = coordinates[1] / window.innerHeight * 2;
    this.raycaster.setFromCamera(this.mouse, camera);
    var intersectsRoot = this.raycaster.intersectObjects( this.rootNode );
    if(intersectsRoot.length > 0){
      this.showInactiveButtons();
      TWEEN.removeAll();
      this.phases.forEach( (p) => {
        if(p.sproutChildren && p.isSprouted){
          this.hidePhaseChildren(p.children[0]);
        }
      });
      let cameraTarget =intersectsRoot[0].object.getWorldPosition().clone();
      cameraTarget.z = this.cameraDistance;
      //let cameraLookAt =intersectsRoot[0].object.getWorldPosition().clone();      
      //this.moveCameraTo(cameraTarget, cameraLookAt);
      this.moveCameraTo(cameraTarget);
      this.hideFilterMenu();
    }else{
      var intersects = this.raycaster.intersectObjects( this.phases.map( (p) => p.children[0] ) );
      if(intersects.length > 0){
        this.showInactiveButtons();
        TWEEN.removeAll();
        let cameraTarget = intersects[0].object.getWorldPosition();
        cameraTarget.z = this.cameraDistance / 1.5;
        cameraTarget.x *= this.cameraDistanceFactor;
        cameraTarget.y *= this.cameraDistanceFactor;
        //this.moveCameraTo(cameraTarget);
        this.moveCameraTo(cameraTarget, 
                          intersects[0].object.getWorldPosition().clone().multiplyScalar(0.75));
        this.phases.forEach( (p) => {
          //if(p.sproutChildren && p.isSprouted){
          if(p.sproutChildren && p.isSprouted && p.children[0] !== intersects[0].object){
            this.hidePhaseChildren(p.children[0]);
          }
        });
        if(!intersects[0].object.parent.isSprouted){
          this.showPhaseChildren( intersects[0].object );
        }
        //this.showPhaseText(intersects[0].object.name);
      }else{
        this.handleMoleculeClick(event);
      }
    }
  },
  handleMoleculeClick(event){
    let coordinates = this.mouseToScene([event.clientX, event.clientY]);
    this.mouse.x = coordinates[0] / window.innerWidth * 2;
    this.mouse.y = coordinates[1] / window.innerHeight * 2;
    this.raycaster.setFromCamera(this.mouse, camera);
    var intersects = this.raycaster.intersectObjects( this.molecules.filter((f) => !f.disabled ));
    if(intersects.length > 0 && !this.popUpActive){
      this.showPopup(intersects[0].object);
    }else{
      this.hidePopup();
      this.hidePopup();
      //this.currentMode = "root";
    }
  },
  reset(){
    this.hideCanvasTouchText();
    //this.hideRoot();
    this.hideSeeAll();
    this.hideFilterMenu();
    //this.phases.forEach( (p) => p.isSprouted = false );
    this.unfilterMolecules();
    this.hidePopup();
    $(".pop-up-holder .attributes-holder > *").removeClass("show");
    this.showInactiveButtons();
    this.phases.forEach( (p, i) => {
      this.hidePhaseChildren(p.children[0], false);
    });
    this.showPipelineText();
    this.moveCameraTo(new THREE.Vector3(0,0,this.cameraDistance));
    camera.lookAt( scene );
  },
  runTouchTextMode(){
    this.currentMode = "touchText";
    this.createCanvasTouchText();
    this.createTouchTextRootAnimationCycle();
  },
  runRootMode(event){
    let coordinates = [event.clientX, event.clientY];
    this.currentMode = "root";
    //this.showRoot([window.innerWidth/2, window.innerHeight/2]);
    this.showSeeAll();
    this.hideFilterMenu();
    this.hidePipelineText();
    let tween = this.createFadeOutRootTween();
    tween.onComplete( () => {
      //this.setBoomerangOpacity( 1.0 );
      this.showRoot([window.innerWidth / 2, window.innerHeight / 2], true, true);
      //this.showPhases();
    });
    tween.start();
  },
  createTouchTextRootAnimationCycle(){
    this.attractionOffsetSpeed = 0;
    this.attractionOffset = 0;
    /*
    this.touchTextRootCycle = Meteor.setInterval( () => {
      //console.log("cycle " + new Date());
      //this.hideRoot();
      let tween = this.createFadeOutRootTween();
      tween.onComplete( () => {
        this.showRoot([window.innerWidth/2, window.innerHeight/2], true);
      });
      tween.start();
    }, 20 * 1000);
    */
    this.rootChildren.children.forEach( (c, i ) => {
      c.offsetSpeed = 0;
    });
  },
  clearTouchTextRootAnimationCycle(){
    /*
    if(this.touchTextRootCycle){
      Meteor.clearInterval(this.touchTextRootCycle);
    }
    */
  },
  createRoot(){
    this.rootGroup = new THREE.Object3D();
    this.textureLoader.load("moleculeImages/circle_home.png", (texture) => {
      var rootGeo = new THREE.PlaneBufferGeometry( 1,1,1 );
      var rootMaterial = new THREE.MeshBasicMaterial({ map: texture });
      rootMaterial.transparent = true;
      var spriteRoot = new THREE.Mesh( rootGeo, rootMaterial );
      this.rootNode = [spriteRoot];
      spriteRoot.shouldShow = true;
      this.rootGroup.add(spriteRoot);
      let scale = this.rootScale;

      spriteRoot.scale.set(scale, scale, scale);
      spriteRoot.material.opacity = 0;
      //atsApp.showRoot([0,0], true);
      atsApp.createPhases();
      atsApp.createAllMolecules();
      atsApp.addReferencesText();
    });
  },
  showRoot(coordinates, immediate, showMolecules){
    if(this.rootChildren){
      this.hidePhases();
    }
    this.rootGroup.visible = true;
    coordinates = this.mouseToScene(coordinates);
    this.rootGroup.position.setX(1 * coordinates[0]);
    this.rootGroup.position.setY(coordinates[1]);

    let fadeTarget = {opacity: 0};
    let fadeTween = new TWEEN.Tween(fadeTarget).to(
      {opacity:1.0}, 
      this.fadeDuration,
      TWEEN.Easing.Exponential.InOut
    );

    fadeTween.onUpdate(() => {
      this.setBoomerangOpacity( fadeTarget.opacity );
    });
    //fadeTween.start();
    let zTween = this.createZTween(coordinates);
    if(immediate){
      this.setBoomerangOpacity(1.0);
      this.showPhases(true);
      if(showMolecules){
        let phases = atsApp.phases.map( (p) => p.children[0] );
        phases.forEach( (p,i) => {
          if(!p.parent.isSprouted){
            /* REALLY BAD AWFUL HACK TO SPEED UP TWEENS TEMPORARILY*/
            let durationHolder = this.sproutDuration;
            this.tweenEasing = TWEEN.Easing.Back.InOut;
            //this.tweenEasing = TWEEN.Easing.Elastic.Out;
            //this.sproutDuration = this.sproutDuration / 1;
            this.sproutDuration = this.sproutDuration / 3;

            let tween = atsApp.showPhaseChildren(p, true) 
            this.sproutDuration = durationHolder;
            this.tweenEasing = TWEEN.Easing.Elastic.Out;
            tween.onComplete( () => {
              this.hidePhaseChildren(p, false, 1000);
              this.controlsEnabled = true;
            });
            Meteor.setTimeout( () => {
              tween.start();
            }, 500);//450 is when this tween's val first is equal to 1
            //}, (i+0) * 100 + 500);
          }
        });
      }

    }else{
      zTween.start();
      fadeTween.start();
      fadeTween.onComplete( () => {
        this.showPhases();
      });
    }
    
    window.scene.add(this.rootGroup);
  },
  createPhaseNode(mapPath, meshName){
    var childGroup = new THREE.Object3D();
    var map = new THREE.TextureLoader().load(mapPath);
    var phaseGeo = new THREE.PlaneBufferGeometry( 1,1,1 );
    var phaseMaterial = new THREE.MeshBasicMaterial({ map });
    phaseMaterial.transparent = true;
    var spritePhase = new THREE.Mesh( phaseGeo, phaseMaterial );

    spritePhase.shouldShow = true;
    //var material = new THREE.MeshLambertMaterial( { map: map });
    var material = new THREE.MeshLambertMaterial();
    material.visible = false;
    //material.transparent = true;
    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var mesh = new THREE.Mesh( geometry, material );
    mesh.name = meshName;


    var tetherMaterial = new THREE.LineBasicMaterial({ 
      color: 0xffffff,
      //color: 0x1666c5,
      linewidth: this.linewidth,
    });
    tetherMaterial.transparent = true;
    /*
    var uniforms = {
    }
    var tetherMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: Shaders.ats2.vertexShader,
      fragmentShader: Shaders.line.fragmentShader,
    });
    tetherMaterial.transparent = true;
    */

    var tetherGeometry = new THREE.Geometry();
    tetherGeometry.vertices.push(
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(0,0,0)
    );
    var tether = new THREE.Line( tetherGeometry, tetherMaterial );
    childGroup.add(mesh);
    childGroup.add(tether);
    childGroup.add(spritePhase);
    childGroup.radiusOffset = 0;
    childGroup.radiusSpeed = 0;
    return childGroup;
  },
  createMoleculeNode( c ) {
    let assetPath = c.assetDirectory + "/" + "output.jpg";
    var childGroup = new THREE.Object3D();
    var map = this.textures[c.name];
    map.wrapS = map.wrapT = THREE.RepeatWrapping;

    /*
      Custom shader stuff
     */
    var uniforms = {
      u_width: { type: "f", value: window.innerWidth },
      u_height: { type: "f", value: window.innerHeight },
      imageTexture: { type: "t", value: map },
      u_time: { type: "f", value: 1.0 },
      u_outer_color: { type: "c", value: new THREE.Color(0xffffff) },
      u_inner_color: { type: "c", value: new THREE.Color(0xffffff) },
      yOffset: { type: "f", value: 0.0 },
      frameSize: { type: "f", value: 0.0 },
      blendShade: { type: "f", value: 1.0 },
      isFiltered: { type: "f", value: 0.0 }
    };

    var shaderMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: Shaders.ats2.vertexShader,
      fragmentShader: Shaders.ats2.fragmentShader,
    })
    shaderMaterial.transparent = true;
    var geo = new THREE.PlaneBufferGeometry(1,1,1);
    var spriteMolecule = new THREE.Mesh( geo, shaderMaterial );
    spriteMolecule.position.z += 1;
    //spriteMolecule.map = map;
    spriteMolecule.material.map = map;
    spriteMolecule.shouldShow = true;
    this.molecules.push(spriteMolecule);
    spriteMolecule.name = c.name;
    spriteMolecule.subtitle = c.subtitle;
    spriteMolecule.text = c.text;
    spriteMolecule.large = c.large;
    spriteMolecule.small = c.small;
    spriteMolecule.copd = c.copd;
    spriteMolecule.asthma = c.asthma;
    spriteMolecule.video = c.assetDirectory + "/" + c.video;
    spriteMolecule.currentDisplayTime = 0;
    spriteMolecule.startTile = c.assetsStart  - 1;
    //spriteMolecule.currentTile = spriteMolecule.startTile;

    spriteMolecule.animationDuration = 1000 * c.duration;
    spriteMolecule.numberFrames = c.assetsEnd - c.assetsStart + 1;
    spriteMolecule.currentTile = Math.ceil(Math.random() * spriteMolecule.numberFrames);
    map.repeat.set( 1, 1 / spriteMolecule.numberFrames );
    spriteMolecule.mspf = spriteMolecule.animationDuration / spriteMolecule.numberFrames;
    uniforms.frameSize.value = 1 / spriteMolecule.numberFrames;
    var tetherMaterial = new THREE.LineBasicMaterial({ 
      color: 0xffffff,
      //color: 0x1666c5,
      linewidth: this.linewidth,
    });
    var tetherGeometry = new THREE.Geometry();
    tetherGeometry.vertices.push(
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(0,0,0)
    );
    var tether = new THREE.Line( tetherGeometry, tetherMaterial );
    childGroup.add(spriteMolecule);
    childGroup.add(tether);

    let labelMap = new THREE.TextureLoader().load("moleculeImages/" + c.label);
    //let labelMap = new THREE.TextureLoader().load("moleculeImages/molecule_label.png");
    //let labelMap = new THREE.TextureLoader().load(c.assetDirectory + c.label);
    //childGroup.add(labelSprite);
    //let labelMaterial = new THREE.SpriteMaterial( {map: labelMap} );
    //let labelSprite = new THREE.Sprite( labelMaterial );
    let labelMaterial = new THREE.MeshBasicMaterial( {map: labelMap} );
    labelMaterial.transparent = true;
    let labelGeo = new THREE.PlaneBufferGeometry( 1,1,1 );
    let labelSprite = new THREE.Mesh( labelGeo, labelMaterial );


    //labelSprite.position.y = -65;
    labelSprite.scale.setX(200);
    labelSprite.scale.setY(50);
    labelMaterial.opacity = 0;
    labelSprite.visible = false;
    childGroup.add(labelSprite);

    return childGroup;
  },
  createPhases(){
    //let self = this;
    let sprite1 = this.createPhaseNode("moleculeImages/Phase1.png", 'phase1');
    this.phases.push(sprite1);
    let sprite2 = this.createPhaseNode("moleculeImages/Phase2.png", 'phase2');
    this.phases.push(sprite2);
    let sprite3 = this.createPhaseNode("moleculeImages/Phase3.png", 'phase3');
    this.phases.push(sprite3);
    this.rootChildren = new THREE.Object3D();
    this.rootChildren.add(sprite2);
    this.rootChildren.add(sprite1);
    this.rootChildren.add(sprite3);
    this.rootGroup.add(this.rootChildren);
    //Set the angle to home for each sprite
    this.rootChildren.children.forEach( ( c, i ) =>{
      c.angleFromHome = (i+1) * Math.PI * 2 / this.rootChildren.children.length - (Math.PI / 3);
    });
  },
  showPhases(keepControlsDisabled){
    this.controlsEnabled = false;
    let sproutTarget = { val: 0 };
    let sproutTween = new TWEEN.Tween(sproutTarget).to(
      {val:1.0}, 
      this.rootSproutDuration,
    );
    sproutTween.easing( this.tweenEasing );
    sproutTween.onUpdate(() => {
      let s = sproutTarget.val * this.phaseScale;
      let newValue = sproutTarget.val * this.phaseDistance;
      let rootRadiusOffset = Math.max(0, newValue - this.rootScale/2);
      this.rootChildren.children.forEach( (c, i) => {
        let angle = c.angleFromHome;
        let newX = Math.cos(angle) * newValue;
        let newY = Math.sin(angle) * newValue;
        let newXOffset, newYOffset;
        let newLineStartX = (Math.cos(angle) * (s/2 - 6));
        let newLineStartY = (Math.sin(angle) * (s/2 - 6));
        //Only draw lines if you've passed the edge of the root node
        if(newValue > this.rootScale/2){
          newXOffset = Math.cos(angle) * (newValue - this.rootScale / 2 + 4);
          newYOffset = Math.sin(angle) * (newValue - this.rootScale / 2 + 4);
        }else{
          newXOffset = newLineStartX;
          newYOffset = newLineStartY;
        }
        c.children[0].scale.set(s,s,s);
        c.children[2].scale.set(s,s,s);
        c.position.x = newX;
        c.position.y = newY;
        c.children[1].geometry.vertices[1].setX(-1 * newXOffset);
        c.children[1].geometry.vertices[1].setY(-1 * newYOffset);
        c.children[1].geometry.vertices[0].setX(-1 * newLineStartX);
        c.children[1].geometry.vertices[0].setY(-1 * newLineStartY);
        c.children[1].geometry.verticesNeedUpdate = true;

        c.children[1].visible = true;
        c.children[1].material.linewidth = this.linewidth;
      });
      if(sproutTarget.val > 1.0 && !keepControlsDisabled){
        this.controlsEnabled = true;
      }
    });
    sproutTween.onComplete( () => {

    });

    sproutTween.start();
  },
  hidePhases(){
    this.rootChildren.children.forEach( (c,i) => {
      let s = 0.0001;
      let newX = 0;
      let newY = 0;
      let newLineStartX = 0;
      let newLineStartY = 0;
      c.children[0].scale.set(s,s,s);
      c.children[2].scale.set(s,s,s);
      c.position.x = newX;
      c.position.y = newY;
      c.children[1].geometry.vertices[1].setX(-1 * newX);
      c.children[1].geometry.vertices[1].setY(-1 * newY);
      c.children[1].geometry.vertices[0].setX(-1 * newLineStartX);
      c.children[1].geometry.vertices[0].setY(-1 * newLineStartY);
      c.children[1].geometry.verticesNeedUpdate = true;
      c.children[1].visible = false;
      c.children[1].material.linewidth = 0.1;
      //Label
    });
  },
  hideRoot(){
    this.rootGroup.visible = false;
    this.rootGroup.children.map( (c) => {
      if(c.shouldShow){
        c.material.opacity = 0;
      }
    });
  },
  createFadeOutRootTween(){
    let fadeTarget = {opacity: 1.0};
    let fadeTween = new TWEEN.Tween(fadeTarget).to(
      {opacity:0.0}, 
      1000,
      TWEEN.Easing.Exponential.InOut
    );
    fadeTween.onUpdate(() => {
      this.setBoomerangOpacity( fadeTarget.opacity );
    });
    return fadeTween
  },
  setBoomerangOpacity(value){
    if(this.rootGroup.children[0] && this.rootGroup.children[0].material){
      this.rootGroup.children[0].material.opacity = value;
    }
    this.phases.forEach( (p) => {
      if(value >= 1.0){
        p.children[1].material.transparent = false;
      }else{
        p.children[1].material.transparent = true;
      }
      if(p.children){
        p.children[2].material.opacity = value;
        p.children[1].material.opacity = value;
      }
    });
  },
  createCanvasTouchText(){
    let numSprites = 4;
    this.touchText = new THREE.Object3D();    
    scene.add(this.touchText);

    //let w = renderer.getSize().width / 1 + 50;
    let w = 1100;
    let h = renderer.getSize().height / 3;
    this.index =0;
    let positions = [
      [ -1 * w, h * 2 - 100],
      [ -1 * w, h * 1],
      //[ -1 * w, h - 150],

      [ -1 * w, -1 * h + 150],
      [ -1 * w, -1 * h],
      [ -1 * w, -2 * h],

      [ 1 * w, -1 * h + 150],
      [ 1 * w, -1 * h],
      [ 1 * w, -2 * h],

      //[ 1 * w, h - 150],
      [ 1 * w, h * 1],
      [ 1 * w, h * 2],
    ];

    this.touchTextPositions = this.shuffle(positions);
    //Create text sprite
    this.textureLoader.load("moleculeImages/touch_transparent.png", (texture) => {
      let textSpriteMaterial = new THREE.SpriteMaterial( {map: texture} );
      let textSprite = new THREE.Sprite( textSpriteMaterial );      
      textSprite.scale.setX( 60 * 32 / 5 );
      textSprite.scale.setY( 60 );
      textSprite.position.x = 0;
      textSprite.position.y = -500;
      textSprite.isIcon = false;
      this.touchText.add(textSprite);
    });

    //Create touch icons
    this.textureLoader.load("moleculeImages/finger_icon.png", (texture) => {
      for(var i = 0; i < numSprites; i++){
        let spriteMaterial = new THREE.SpriteMaterial( { map: texture });
        spriteMaterial.transparent = true;
        let iconSprite = new THREE.Sprite( spriteMaterial );      
        iconSprite.isIcon = true;
        this.touchText.add(iconSprite);
        let s = 150;
        iconSprite.scale.setX(s);
        iconSprite.scale.setY(s);
      }
      this.touchText.visible = false;
      this.showCanvasTouchText();
    });
  },
  showCanvasTouchText(){
    this.touchText.visible = true;
    let numSprites = this.touchText.children.length - 1;
    this.touchText.children.filter( c => c.isIcon ).forEach( (textSprite, i) => {
      textSprite.timeOffset = i * 1 / numSprites * this.touchTextCycleLength;
      this.setTouchTextPosition( textSprite );
    });
  },
  hideCanvasTouchText(){
    if(this.touchText){
      this.touchText.visible = false;
    }
  },
  updateCanvasTouchText( clockDelta ){
    if(this.touchText){
      this.touchText.children.filter( c => c.isIcon ).forEach( (t) => {
        t.timeOffset += clockDelta * 1000;
        if(t.timeOffset < this.touchTextFade){
          t.position.z = -1 * this.touchTextZ;
          t.material.opacity = t.timeOffset / atsApp.touchTextFade;
        }else if(t.timeOffset > (this.touchTextFade + this.touchTextGrow)){
          //t.position.z = this.touchTextZ;
          t.material.opacity = 1 - ((t.timeOffset - this.touchTextFade - this.touchTextGrow) / this.touchTextFade);
        }else{
          let growTime = t.timeOffset - this.touchTextFade;
          let val = Math.sin(1* Math.PI / 2 + growTime / this.touchTextGrow * Math.PI * 2 / 4);
          t.material.opacity = 1;
          let toAdd = camera.position.clone().sub(t.position.clone()).normalize().multiplyScalar(val * 2.9);
          t.position.add(toAdd);
          let r = camera.getWorldRotation();
          t.rotation.set(r.x, r.y, r.z, r.order);
        }

        if(t.timeOffset > this.touchTextCycleLength){
          t.timeOffset = 0;
          this.setTouchTextPosition(t);
        }
      });
    }
  },
  shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  },
  setTouchTextPosition(textSprite){
    this.index++;
    this.index = this.index % this.touchTextPositions.length;
    let coords = this.touchTextPositions[this.index];
    textSprite.position.x = coords[0] + (Math.random() - 0.5) * 300;
    textSprite.position.y = coords[1] + (Math.random() - 0.5) * 40;
  },
  mouseToScene(coordinates){
    let [x,y] = coordinates;
    //const sceneX = (( x / window.innerWidth ) * 2 - 1) * window.innerWidth;
    //const sceneY = (-1 * ( y / window.innerHeight ) * 2 + 1) * window.innerHeight;
    const sceneX = (( x / window.innerWidth ) * 2 - 1) * window.innerWidth / 2;
    const sceneY = (-1 * ( y / window.innerHeight ) * 2 + 1) * window.innerHeight / 2;
    return [sceneX, sceneY];
  },
  createAllMolecules(){
    this.phases.map( (p) => p.children[0] ).forEach( (phaseObject) => {
      let parentObject = phaseObject.parent;
      if(parentObject.sproutChildren === undefined){
        let childrenData = phaseChildren[phaseObject.name];
        let childMolecules = this.createMolecules( childrenData );
        let angleToHome = 2 * Math.PI - parentObject.angleFromHome;
        let angleStart = angleToHome + (Math.PI / 6) + Math.PI/4;
        let angleEnd = angleStart + (Math.PI*5/3) - Math.PI/4;

        let angleGap = (angleEnd-angleStart) / childMolecules.length;
        childMolecules.forEach( (c, i) => {
          c.angleFromHome = angleStart + ((i + 0.5) * angleGap);
          //Place the molecule's label based on the angleFromHome
          let label = c.children[2];
          /*
          label.position.y = (c.angleFromHome % (Math.PI * 2)) < Math.PI
            ? 73
            : -73;
          */
          let labelX = Math.cos(c.angleFromHome) * this.moleculeScale;
          let labelY = Math.sin(c.angleFromHome) * this.moleculeScale;
          //One of the labels is a lot longer than the others...
          let labelXOffset = 20 * 1.5;
          if(c.children[0].name == "Aclidinium / Formoterol"){
            labelXOffset += 25;
          }
          labelX += Math.cos(c.angleFromHome) * labelXOffset;
          labelY += Math.sin(c.angleFromHome) * 2 / 20;
          label.position.x += -1 * labelX;
          label.position.y += 1 * labelY;
        });
        let sproutGroup = new THREE.Object3D();
        parentObject.add(sproutGroup)
        parentObject.sproutChildren = sproutGroup;
        childMolecules.forEach( (c,i) => {
          sproutGroup.add(c);
        });
      }
    });
  },
  showPhaseChildren(phaseObject, returnChainable = false){
    let parentObject = phaseObject.parent;
    if(parentObject.sproutChildren === undefined){
      let childrenData = phaseChildren[phaseObject.name];
      let childMolecules = this.createMolecules( childrenData );
      let angleToHome = 2 * Math.PI - parentObject.angleFromHome;
      let angleStart = angleToHome + (Math.PI / 2);
      let angleEnd = angleStart + (Math.PI* 3 / 4);

      let angleGap = (angleEnd-angleStart) / childMolecules.length;
      childMolecules.forEach( (c, i) => {
        c.angleFromHome = angleStart + ((i + 0.5) * angleGap);
      });
      let sproutGroup = new THREE.Object3D();
      parentObject.add(sproutGroup)
      parentObject.sproutChildren = sproutGroup;
      childMolecules.forEach( (c,i) => {
        sproutGroup.add(c);
      });
    }
    let sproutTween = this.createSproutTween(this.moleculeDistance, this.moleculeScale, parentObject, false);

    if(returnChainable){
      return sproutTween;
    }else{
      this.showFilterMenu();
      sproutTween.start();
    }
  },
  createMolecules(children){
    return children = children.map( (c, i) => {
      let child = this.createMoleculeNode(c);
      return child;
    });
  },
  hidePhaseChildren(phaseObject, force = false, delay=false){
    let parentObject = phaseObject.parent;
    if(force){
      parentObject.sproutChildren.children.forEach( (c, i) => {      
        let s = 0.00001;
        c.children[0].scale.set(s,s,s);
        c.position.x = 0;
        c.position.y = 0;
        //c.scale.set(s,s,s);
        let line = c.children[1];

        line.geometry.vertices[1].setX(0);
        line.geometry.vertices[1].setY(0);
        line.geometry.verticesNeedUpdate = true;
        let label = c.children[2];
        label.opacity = 0;
        line.visible = false;
        line.material.linewidth = 0.1;
        label.visible = false;
      });
    }else if(parentObject.isSprouted){
      let reverseTween = this.createSproutTween(this.moleculeDistance, this.moleculeScale, parentObject, true);
      if(delay !== false){
        reverseTween.delay(delay).start();
      }else{
        reverseTween.start();
      }
    }
  },
  createSproutTween(radius, scale, sproutParent, reverse = false){
    if(!reverse){
      this.controlsEnabled = false;
    }
    let start, end, duration;
    if(reverse){
      start = 1;
      end = 0.00001;
      sproutParent.isSprouted = false;
    }else{
      start = 0.00001;
      end = 1;
      sproutParent.isSprouted = true;
    }
    let sproutTarget = { val: start };
    duration = reverse
      ? this.reverseSproutDuration
      : this.sproutDuration
    let sproutTween = new TWEEN.Tween(sproutTarget).to(
      {val:end}, 
      duration,
    );
    if(!reverse){
      sproutTween.easing( this.tweenEasing );
    }
    let twoPI = Math.PI * 2;
    let k;
    sproutTween.onUpdate(() => {
      let scale = sproutTarget.val * this.moleculeScale;
      let newValue = sproutTarget.val * radius;
      let newLineValue = Math.max(0, newValue - this.phaseScale /2 + 7);
      sproutParent.sproutChildren.children.forEach( (c, i) => {
        if(!reverse){
          let temp = (c.angleFromHome % twoPI) / twoPI;
          let val = sproutTarget.val;
          k = Math.pow(val, temp);
        }else{
          k = 1;
        }
        let newX = -1 * Math.cos(c.angleFromHome) * newValue * k;
        let newY = Math.sin(c.angleFromHome) * newValue * k;
        let newLineX = -1 * Math.cos(c.angleFromHome) * newLineValue * k;
        let newLineY = Math.sin(c.angleFromHome) * newLineValue * k;

        //Scale the cube
        c.children[0].scale.set(scale, scale, scale);
        c.position.x = newX;
        c.position.y = newY;
        let line = c.children[1].geometry;
        //if(newValue > this.phaseScale / 2){
        if((newValue * k) > this.phaseScale / 2){
          line.vertices[1].setX(-1 * newLineX );
          line.vertices[1].setY(-1 * newLineY );
        }
        c.children[1].visible=true;
        c.children[1].material.linewidth = this.linewidth;
        line.verticesNeedUpdate = true;
        let label = c.children[2];
        label.material.opacity = sproutTarget.val;
        if(sproutTarget.val > 0.01){
          label.visible = true;
        }else{
          label.visible = false;
        }
      });
      if(sproutTarget.val > 1.0){
        this.controlsEnabled = true;
      }
    });
    sproutTween.onComplete( () => {
      if(reverse){
        sproutParent.sproutChildren.children.forEach((c) =>{
          c.children[1].visible = false;
          if(reverse){
            c.position.x = 0;
            c.position.y = 0;
            c.children[0].scale.set(0.001,0.001,0.001);
            let line = c.children[1];
            c.children[2].visible = false;
          }
        });
        sproutParent.isSprouted = false;
      }
    });
    return sproutTween;
  },
  animateMolecules(deltaMS){
    this.molecules.forEach( ( m ) => {
      m.currentDisplayTime += deltaMS;
      if(m.currentDisplayTime > m.mspf){
        m.currentTile = (m.currentTile + 1) % m.numberFrames;
        m.material.map.offset.y = (m.currentTile / m.numberFrames);
        m.currentDisplayTime = 0;
        m.material.uniforms.yOffset.value = (m.currentTile / m.numberFrames);
        m.material.uniforms.u_time.value += 0.01;
        //m.material.uniforms.yOffset = 
      }
    });
    if(atsApp.currentMode == "touchText" && this.rootChildren && this.rootChildren.children){
      //this.attractionOffsetSpeed += (Math.random() - 0.5) * 4;
      //this.attractionOffset += this.attractionOffsetSpeed * deltaMS / 1000 / 1.1;
      this.attractionOffset = Math.sin(Date.now() / 2500) * 120;
      /*
      if(
        Math.abs(this.attractionOffset) > (0.4 * this.phaseDistance)
      ){
        //Calm this down a bit
        this.attractionOffset *= 0.99;
      }
      if(
        Math.abs(this.attractionOffset) > (0.3 * this.phaseDistance)
      ){
        this.attractionOffsetSpeed *= .75;
      }
      */
      this.rootChildren.children.forEach( (c,i) => {
        let angle = c.angleFromHome;
        let newX = Math.cos(angle) * (this.attractionOffset + this.phaseDistance);
        let newY = Math.sin(angle) * (this.attractionOffset + this.phaseDistance);
        let deltaX = c.position.x - newX;
        let deltaY = c.position.y - newY;
        c.position.x = newX
        c.position.y = newY
        c.children[1].geometry.vertices[1].x += deltaX;
        c.children[1].geometry.vertices[1].y += deltaY;
        c.children[1].geometry.verticesNeedUpdate = true;
      });
    }
  },
  createZTween(homeCoordinates){
    let zTarget = {val: 0};
    let extraDuration = this.rootClickDuration / this.numOscillations;
    let totalDuration = this.rootClickDuration + extraDuration;
    let zTween = new TWEEN.Tween(zTarget).to(
      {val:1.0}, 
      totalDuration,
      TWEEN.Easing.Exponential.InOut
    );

    zTween.onUpdate(() => {
      if(zTarget.val < this.rootClickDuration / totalDuration){
        let magnitude = -1 * Math.sin(zTarget.val * Math.PI * 2 * this.numOscillations) * this.bounce * Math.pow(1.0 - zTarget.val, 4);
        let directionVector = camera.position.clone().normalize();
        let delta = directionVector.multiplyScalar(magnitude);
        this.rootGroup.position.x += delta.x;
        this.rootGroup.position.y += delta.y;
        this.rootGroup.position.z += delta.z;
      }
    });
    
    return zTween;

  },
  showSeeAll(){
    $("#see-all-button").addClass("show");
    $("#references-button").addClass("show");
  },
  hideSeeAll(){
    $("#see-all-button").removeClass("show");
    $("#references-button").removeClass("show");
  },
  showPopup(molecule){
    this.popUpActive = true
    //Set the title
    $(".pop-up-title").text(molecule.name);
    $(".pop-up-subtitle").text(molecule.subtitle);
    //Set the text
    $(".pop-up-text").html(molecule.text);
    //Set the video
    let video = document.getElementById("pop-up-video");
    video.src = molecule.video;
    video.load();
    $(".pop-up-container").addClass("show");
    this.showPopupMoleculeAttributes(molecule);
  },
  hidePopup(){
    this.popUpActive = false
    let video = document.getElementById("pop-up-video");
    video.pause();
    video.src = "";
    $(".pop-up-container").removeClass("show");
    $(".references-pop-up-container").removeClass("show");
    let referencesButton = $("#references-button")[0];
    referencesButton.src = referencesButton.src.replace("_active", "");
  },
  showFilterMenu(){
    let elements = $(".area-under-investigation");
    elements.addClass("show");
  },
  hideFilterMenu(){
    let elements = $(".area-under-investigation");
    elements.removeClass("show");
  },
  moveCameraTo(newPosition, cameraLookAt){
    //newPosition.z = this.cameraDistance;
    //let target = camera.getWorldPosition();
    let camPos = camera.getWorldPosition().clone();
    let camTarget = this.cameraTarget.clone();
    if(cameraLookAt === undefined){
      cameraLookAt = scene.position.clone();
    }
    let target = {
      //cameraPosition: camera.getWorldPosition().clone(),
      //cameraTarget: this.cameraTarget.clone()
      camX: camPos.x,
      camY: camPos.y,
      camZ: camPos.z,
      lookAtX: camTarget.x,
      lookAtY: camTarget.y,
      lookAtZ: camTarget.z,
    }
    let cameraTween = new TWEEN.Tween(target).to(
      {
        camX: newPosition.x,
        camY: newPosition.y,
        camZ: newPosition.z,
        lookAtX: cameraLookAt.x,
        lookAtY: cameraLookAt.y,
        lookAtZ: cameraLookAt.z,
      },
      this.cameraMoveDuration,
    );
    cameraTween.easing(TWEEN.Easing.Back.Out);

    cameraTween.onUpdate( () => {
      camera.position.set(target.camX, target.camY, target.camZ);
      let newLookAt =new THREE.Vector3(target.lookAtX, target.lookAtY, 0); 
      camera.lookAt( newLookAt );
      //camera.lookAt( scene.position );      
      this.cameraTarget = newLookAt.clone();
    });
    cameraTween.start();
  },
  filterMolecules(filterBy){
    this.molecules.forEach( (m) => {
      if(m.parent.parent.parent.isSprouted){
        if(m[filterBy]){
          this.highlightNode(m, filterBy);
        }else{
          this.unhighlightNode(m, filterBy);
        }
      }
    });
  },
  addMoleculeFilter(filterBy, filterType){
    this.currentFilter[filterType] = filterBy;
    this.highlightFilteredMolecules();
  },
  highlightFilteredMolecules(){
    this.molecules.forEach( (m) => {
      if(m.parent.parent.parent.isSprouted){
        if(
          (
            !this.currentFilter.disease
            || m[this.currentFilter.disease] )
          && (!this.currentFilter.size
            || m[this.currentFilter.size]
             )
        ){
          this.highlightNode(m);
        }else{
          this.unhighlightNode(m);
        }
      }
      if(this.currentFilter.disease || this.currentFilter.size){
        m.material.uniforms.isFiltered.value = 1.0;
      }else{
        m.material.uniforms.isFiltered.value = 0.0;
      }
    });
    let imgs = $(".area-under-investigation img");
    _.forEach( imgs, (img) => {
      img.classList.remove("selected");
      img.src = img.src.replace("_active", "");
    });
    let diseaseButton = $("#" + this.currentFilter.disease + "-button");
    let sizeButton = $("#" + this.currentFilter.size + "-button");
    if(diseaseButton.length > 0) atsApp.highlightButton(diseaseButton[0]);
    if(sizeButton.length > 0) atsApp.highlightButton(sizeButton[0]);
  },
  unfilterMolecules(){
    this.currentFilter.size = undefined;
    this.currentFilter.disease = undefined;
    this.highlightFilteredMolecules();
  },
  removeMoleculeFilter(filterBy, filterType){
    this.currentFilter[filterType] = undefined;
    this.highlightFilteredMolecules();
  },
  highlightNode(n){
    if(this.currentFilter.disease){
      n.material.uniforms.u_inner_color.value.setRGB(...this.innerColor);
    }else{
      n.material.uniforms.u_inner_color.value.setRGB(...this.outerColor);
    }
    if(this.currentFilter.size){
      n.material.uniforms.u_outer_color.value.setRGB(...this.outerColor);
    }else{
      n.material.uniforms.u_outer_color.value.setRGB(...this.innerColor);
    }
    n.material.uniforms.blendShade.value = 1.0;
    n.disabled = false;
    n.parent.children[2].material.opacity = 1.0;
  },
  unhighlightNode(n){
    n.material.uniforms.u_outer_color.value.setRGB(1.0, 1.0, 1.0);
    n.material.uniforms.u_inner_color.value.setRGB(1.0, 1.0, 1.0);
    n.material.uniforms.blendShade.value = 0.3;
    n.disabled = true;
    n.parent.children[2].material.opacity = 0.5;
  },
  getXYDistance(o1, o2){
    let x = o1.position.x - o2.position.x;
    let y = o1.position.y - o2.position.y;
    let sum = Math.pow(x, 2) + Math.pow(y, 2);
    let result = Math.pow(sum, 0.5);
    return result;
  },
  highlightButton(button){
    if(!button.classList.contains("selected")){
      button.classList.add("selected");
      button.src = button.src.replace(".png", "_active.png");
    }
  },
  unhighlightButtons(){  
    $(".area-under-investigation img.selected").each( (index, button) => {
      button.classList.remove("selected");
      button.src = button.src.replace("_active", "");
      $(".pop-up-holder .attributes-holder > *").removeClass("show");
    });
  },
  showPopupMoleculeAttributes(molecule){
    this.moleculeAttributes.forEach( (attr) => {
      if( molecule[attr] ){
        $("#" + attr + "-popup").addClass("show");
      }else{
        $("#" + attr + "-popup").removeClass("show");
      }
    });
  },
  showPipelineText(){
    $("img#pipeline-logo").addClass("show");
  },
  hidePipelineText(){
    $("img#pipeline-logo").removeClass("show");
  },
  showInactiveButtons(){
    let seeAllButton = $("#see-all-button")[0];
    seeAllButton.src = seeAllButton.src.replace("_active", "");
    let referencesButton = $("#references-button")[0];
    referencesButton.src = referencesButton.src.replace("_active", "");
  },
  showReferences(){
    $(".references-pop-up-container").addClass("show");
    let referencesButton = $("#references-button")[0];
    referencesButton.src = referencesButton.src.replace(".svg", "_active.svg");
    this.popUpActive = true;
  },
  addReferencesText(){
    let parent = $(".references-pop-up-text");
    let refs = atsReferences.split("\n")
        .filter((r) => r.length > 0 )
        .map( r => {
          let c = document.createElement("div");
          //c.textContent = r;
          c.innerHTML = r;
          return c;
        });
    parent.append(refs);
  },
  resizeReferencesText(){
    let el = $(".references-pop-up-container")
    let w = el.width();
    let h = el.height();
    let newSize = Math.round( Math.pow(h * w, 0.5) / 75);
    let forceSize = +FlowRouter.getQueryParam("font");
    if(forceSize){
      $(".references-pop-up-text div").css("font-size", forceSize + "px");
    }else{
      $(".references-pop-up-text div").css("font-size", newSize + "px");
    }
  }
}

window.atsApp = atsApp;


Template.ats2.helpers({
  
});

Template.ats2.events({
  'click canvas': (event, template) => {
    atsApp.setIdleTimeout();
    if(atsApp.controlsEnabled){
      atsApp.handleClick(event);
    }
  },
  'click #see-all-button': (event, template) => {
    atsApp.hidePopup();
    atsApp.setIdleTimeout();
    atsApp.moveCameraTo(new THREE.Vector3(0,0,atsApp.cameraDistance));
    if(event.target.src.indexOf("active") === -1){
      event.target.src = event.target.src.replace("seeall", "seeall_active");
    }
    let phases = atsApp.phases.map( (p) => p.children[0] );
    phases.forEach( (p) => {
      if(!p.parent.isSprouted){
        atsApp.showPhaseChildren(p) 
      }
    });
    atsApp.unfilterMolecules();
  },
  'click #references-button': (event, template) => {
    if(!atsApp.popUpActive){
      atsApp.showReferences();
    }else{
      atsApp.hidePopup();
    }
    atsApp.setIdleTimeout();
  },
  'click .pop-up-close': (event, template) => {
    atsApp.hidePopup();
    atsApp.setIdleTimeout();
  },
  'click .area-under-investigation img': (event, template) => {
    atsApp.setIdleTimeout();
    const selected = event.target.classList.contains("selected");
    let id = event.target.id;
    let filterBy = id.split("-")[0];
    let filterType = event.target.dataset.filterType;
    if(atsApp.popUpActive){
      atsApp.hidePopup();
    }
    if(!selected){
      atsApp.addMoleculeFilter(filterBy, filterType);
    }else{

      atsApp.removeMoleculeFilter(filterBy, filterType);
    }
  },
});

Template.ats2.rendered = () => {

  atsApp.cameraDistance = +FlowRouter.getQueryParam("d") || atsApp.cameraDistance;
  atsApp.maxIdleTime = (+FlowRouter.getQueryParam("t") || 120) * 1000;
  var texturePaths = [
    "moleculeImages/circle_home.png",
    "moleculeImages/Phase1.png",
    "moleculeImages/Phase2.png",
    "moleculeImages/Phase3.png",
  ];
  Object.keys(phaseChildren).forEach( (p) => {
    phaseChildren[p].forEach( (c) => {
      let assetPath = c.assetDirectory + "/" + "output.jpg";
      atsApp.textures[c.name] = atsApp.textureLoader.load(assetPath);
    });
  });

  var GLOBALS = {};

  var canvas = document.getElementById("ats-canvas"),
      canvasWidth = window.innerWidth,
      canvasHeight = window.innerHeight,
      renderer, scene, cameraControls, 
      GLOBALS, camera, ambientLight,
      directionalLight, attributes, uniforms,
      shaderMaterial, geometry, plane,
      animation, animations = [],
      clock, appMode;

  clock = new THREE.Clock();
  window.clock = clock;
  scene = new THREE.Scene();
  
  renderer = new THREE.WebGLRenderer( {canvas, alpha: true, antialias: true });
  renderer.setPixelRatio( window.devicePixelRatio );

  renderer.setSize( canvasWidth, canvasHeight );
  window.renderer = renderer;

  renderer.setClearColor( new THREE.Color( 0x000000, 0.0 ) );
  renderer.setClearAlpha(0);

  camera = new THREE.PerspectiveCamera( 35, canvasWidth/ canvasHeight, 1, 10000 );
  if(atsApp.focalLength) camera.setFocalLength(atsApp.focalLength);
  /*
  camera = new THREE.OrthographicCamera( canvasWidth * -1/2,
                                         canvasWidth * 1/2,
                                         canvasHeight * 1/2,
                                         canvasHeight * -1/2,
                                         -500, 1000 );
  */
  window.camera = camera;
  camera.position.set( 0, 0, atsApp.cameraDistance );
  camera.lookAt( scene.position );

  if(FlowRouter.getQueryParam("controls")){
    cameraControls = new OrbitControls( camera, renderer.domElement);
    cameraControls.target.set( 0, 0, 0 );
  }

  ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add( ambientLight );

  directionalLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
  directionalLight.position.set( 0, 0, 1);

  scene.add( directionalLight );
  window.scene = scene;
  
  atsApp.createRoot();
  /*
  atsApp.createPhases();
  atsApp.createAllMolecules();
  atsApp.addReferencesText();
  atsApp.showRoot([0,0], true);
  */
  canvas.style.opacity = 0;
  animate();
  setTimeout( () => {
    canvas.style.opacity = 1;
    atsApp.hideRoot();
    atsApp.hidePhases();
    atsApp.runTouchTextMode();
    atsApp.showRoot([window.innerWidth/2, window.innerHeight/2]);
    atsApp.showPipelineText();
    atsApp.resizeReferencesText();
  }, 5000);

  window.addEventListener("resize", onResize);

  function onResize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderer.setSize(canvas.width, canvas.height);
    camera.aspect = canvas.width /canvas.height;
    camera.updateProjectionMatrix();
    atsApp.resizeReferencesText();
  }

  function animate(){
    requestAnimationFrame(animate);
    update();
    render();
  }
  function render(){
    renderer.render( scene, camera );
  }
  function update(){
    TWEEN.update();
    let delta = Date.now() - atsApp.time; 
    let clockDelta = clock.getDelta();
    if(atsApp.currentMode == "touchText"){
      atsApp.updateCanvasTouchText(clockDelta);
    }
    
    atsApp.animateMolecules(clockDelta * 1000);
    let r = camera.getWorldRotation();
    atsApp.phases.forEach( (p) => {
      p.children[2].rotation.set( r.x, r.y, r.z, r.order );
      if(p.isSprouted){
        p.sproutChildren.rotation.set(r.x, r.y, r.z, r.order);
      }
    });
    if(atsApp.rootGroup && atsApp.rootGroup.children.length > 0){
      let c = atsApp.rootGroup.children[0];
      c.rotation.set( r.x, r.y, r.z, r.order );
    }
    let t = 800;
    atsApp.rootGroup.position.z += 0.1 * Math.sin(delta / t);
    atsApp.rootGroup.position.x += 0.15 * Math.sin(delta / t);
    //atsApp.rootGroup.position.y += 0.06 * Math.cos(delta / 500);
    atsApp.rootGroup.position.y += 0.15 * Math.cos(delta / t);
  }
}
