function animate() {

    // Read more about requestAnimationFrame at http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
    if (isRunning) {
        requestAnimationFrame(animate);
        animateCore();
    }
    else {
        actualPostFrame = 0;
        postAnimate();
    }
}

function animateCore() {

    controls.update();

    //Vypocet cutting plane
    var planeGeometry = cuttingPlane.cutBox();
    var planeObject = baseFrontCube(planeGeometry);

    //pridanie noveho cutting plane
    if (planeObject != undefined) {
        frontScene.add(planeObject);
    }


    //render front cube.
    renderer.render(frontScene, camera, frontTexture, true);

    //nastavenie depth bufferu na hodnotu 0
    gl.clearDepth(0.0);
    renderer.clearDepth();

    //render back cube.
    renderer.render(backScene, camera, backTexture, true);
    gl.clearDepth(1.0);

    setShader();

    //ray casting
    renderer.render(scene, camera);

    //zmazanie cutting plane
    if (planeObject != undefined) {
        frontScene.remove(planeObject);
    }
}

function postAnimate() {
    if (actualPostFrame < postFrameCount && !isRunning)
        requestAnimationFrame(postAnimate);

    actualPostFrame++;
    animateCore();
}