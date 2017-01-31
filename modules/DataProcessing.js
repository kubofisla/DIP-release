// JavaScript source code
var maxTextures = 8;
const maxImageValue = 255;
var undersampledSize = 512;
var imageSize;

function preprocessData(pathDir, count, dataSetIndex, startIndex = 0) {

    var maxSide = sizeOfTexture;
    var side = sizeOfImage;
    var StartIndex = startIndex;
    var texNum = 0;

    var ctx = [];
    var texture = [];

    var imagesCount = 0;

    var maxImagesInTexture = Math.pow(maxSide / side, 2);
    var maxImages = maxImagesInTexture * maxTextures;
    var maxColorChanelsInTexture = maxImagesInTexture * 4;
    var maxColorChanelsInRowOfImage = sizeOfImage * 4;
    var maxColorChanelsInRowOfTexture = sizeOfTexture * 4;

    var names;
    var imageCounter;

    for (var i = 0; i < maxTextures; i++) {
        //create canvas context
        var canvas;
        canvas = document.getElementById('myCanvas');
        //canvas = document.createElement('canvas');
        canvas.width = maxSide;
        canvas.height = maxSide;
        ctx.push(canvas.getContext("2d"));

        //create texture
        var tx = new THREE.Texture(canvas);
        texture.push(tx);
    }

    //nacita obrazky upravi ich a vytori z nich textury
    if (isAllLoaded(dataSetIndex))
    {
        imageCounter = 0;
        names = getFileNames(pathDir, count, StartIndex);
        mergeData(names, 0, maxSide - side, texNum, dataSetIndex);
        undersampledData[dataSetIndex] = UndersampleDataset(dataSetIndex, sizeInZ, 1.);
        addUndersampledCubes(dataSetIndex);
    }
    else
        loadPostprocessImages();


    //Metody
    function loadPostprocessImages() {
        names = getFileNames(pathDir, count, StartIndex);
        imagesCount = names.length;
        loadImage(names, 0);
    }

    function loadImage(names, i) {
        if (!names[i])
        {
            isLoaded[dataSetIndex] = true;
            setOtherChanells();
            imageCounter = 0;
            mergeData(names, 0, maxSide - side, texNum, dataSetIndex);
            undersampledData[dataSetIndex] = UndersampleDataset(dataSetIndex, sizeInZ, 1.);

            //Zistenie aktualneho nastaveneho datasetu
            //var e = document.getElementById("DateSetSelect");
            //var type = e.options[e.selectedIndex].value;
            //todo spravit event?
            //if (type == dataSetIndex)
            addUndersampledCubes(dataSetIndex);
            $(".se-pre-con").fadeOut("slow");
        }
        else
        {                          
            var img = new Image;
            img.crossOrigin = 'anonymous';
            img.src = names[i];
            img.onload = function () {
                imageSize = img.naturalWidth;
                
                var canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                var context = canvas.getContext("2d");
                context.drawImage(img, 0, 0);
                dataImages[dataSetIndex][i] = canvas;
                i += 1;
                loadImage(names, i);
                img = undefined;
            };
        }
    }

    function setOtherChanells() {
        var workingImageData = [];
        var ix = 0;

        workingImageData.push(undefined);
        workingImageData.push(undefined);
        //vlozenie prvych 2 obrazkov
        for (; ix < 2; ix++) {
            var context = dataImages[dataSetIndex][ix].getContext("2d");
            var imageData = context.getImageData(0, 0, imageSize, imageSize);
            workingImageData.push(imageData);
        }

        for (ix = 0; dataImages[dataSetIndex][ix]; ix++) {

            var imageData = undefined;
            if (dataImages[dataSetIndex][ix + 2])
            {
                var context = dataImages[dataSetIndex][ix + 2].getContext("2d");
                imageData = context.getImageData(0, 0, imageSize, imageSize);
            }

            workingImageData.shift();
            workingImageData.push(imageData);

            for (var i = 0; i < workingImageData[1].data.length; i += 4) {
                if (!workingImageData[0])
                    workingImageData[1].data[i] = 0;
                else
                    workingImageData[1].data[i] = workingImageData[0].data[i + 1];          //red
                                                                                            //green
                if (!workingImageData[2])
                    workingImageData[1].data[i + 2] = 0;
                else
                    workingImageData[1].data[i + 2] = workingImageData[2].data[i + 1];      //blue

                //if (!workingImageData[3])
                //    workingImageData[1].data[i + 3] = 255;
                //else
                //    workingImageData[1].data[i + 3] = 255;      //alpha
                //workingImageData[1].data[i + 3] = workingImageData[3].data[i + 1];      //alpha
            }

            dataImages[dataSetIndex][ix].getContext("2d").putImageData(workingImageData[1], 0, 0);
        }

    }

    function isAllLoaded(actualDataset) {
        if (isLoaded[actualDataset])
            return true;

        for (var i = 0; i < 3; i++) {
            if (isLoaded[i] == false)
                return false;
        }

        return true;
    }


    function mergeData(names, x, y, texNum, dataSetIndex) {

        var name = names.shift();

        if (!name || imageCounter >= maxImages)
        {
            //texture[texNum].magFilter = THREE.LinearFilter;
            //texture[texNum].minFilter = THREE.LinearFilter;

            if (!name)
                texture[texNum].needsUpdate = true;
            else if (imageCounter > maxImages)
                texture[maxTextures - 1].needsUpdate = true;

            isLoaded[dataSetIndex] = true;
            animate();
            if (isAllLoaded(dataSetIndex)) {
                document.getElementById("QualitySelect").disabled = false;
            }
        }
        else {
            var img;
            if (isLoaded[dataSetIndex]) {
                img = dataImages[dataSetIndex][imageCounter];
                imageCounter += 1;
                drawToCanvas(img, x, y, side, maxSide, ctx, texNum, dataSetIndex);
            }
            else {
                img = new Image;
                img.src = name;
                img.onload = function () {
                    drawToCanvas(img, x, y, side, maxSide, ctx, texNum, dataSetIndex);
                };

                var canvas = document.createElement('canvas');
                canvas.width = side;
                canvas.height = side;
                var context = canvas.getContext("2d");
                context.drawImage(img, 0, 0);

                dataImages[dataSetIndex][imageCounter] = canvas;
                imageCounter += 1;
            }
        }
    }

    function drawToCanvas(img, x, y, side, maxSide, ctx, texNum, dataSetIndex) {
        if (x < maxSide) {
            ctx[texNum].drawImage(img, x, y, side, side);
            x += side;
        }
        else {
            y -= side;
            if (y < 0) {
                //texture[texNum].magFilter = THREE.LinearFilter;
                //texture[texNum].minFilter = THREE.LinearFilter;

                texture[texNum].needsUpdate = true;

                y = maxSide-side;
                texNum += 1;
            }
            x = 0;
            ctx[texNum].drawImage(img, x, y, side, side);
            x += side;
        }
        mergeData(names, x, y, texNum, dataSetIndex);
    }

    //Nastavi ostatne nevyuzite farebne kanaly na hodnoty px v Z osi
    //function setEverySection(ctx) {
    //    var actualTextureIndex = 0;

    //    if(imagesCount > maxImages)
    //        imagesCount = maxImages;

    //    var txIt = 0

    //    for (var i = 0; i < imagesCount; i++) {
            
    //    }


    //    //vrati index na rovnaky pixel v dalsom obrazku
    //    //ak je vystup -1 tak treba dalsiu texturu
    //    //ak je vystup -2 tak treba predchadzajucu texturu
    //    //ak je vystup -3 tak je vystup (0,0,0)
    //    function getPixelImageIndex(index, move) {
    //        var nextIndex = index + maxColorChanelsInImage * move;

    //        var indexMod = nextIndex % maxColorChanelsInRowOfTexture
    //        if (indexMod < maxColorChanelsInRowOfImage)

    //        if(nextIndex > maxColorChanelsInTexture)
    //            return -1;
    //        if(nextIndex < 0)
    //            return -2;

    //        return nextIndex;
    //    }
    //}

    return texture;
}

function UndersampleDataset(dataSetIndex, sizeInZ, maxSize) {
    var c_boxSize = 64;

    //pomocne premenne pre simulovanie 3D textury
    //imgDataIndex je index do dat obrazku(musi sa nasobit 4 -> rgba)
    var imgDataIndex = 0, x = 0, y = 0, z = 0;

    //Vysledne pole prvy prvok min hodnota druha max hodnota
    var undersampled_A = [];
    //index v poli undersampled_A
    var usIndex = 0;

    //Data obrazkov
    var imageData_A = [];

    //maximalny pocet obrazkov
    var maxImagesInTexture = Math.pow(sizeOfTexture / sizeOfImage, 2);
    var maxImages = maxImagesInTexture * maxTextures;

    //rozmer tvoreneho podvzorkovaneho setu
    undersampledSize = imageSize / c_boxSize;
    if(undersampledSize < 2)
        undersampledSize = 2;
    //rozmer voxelov v novom podsamplovanom
    var boxResolution = imageSize / undersampledSize;
    
    //inicializacia pola
    for (var i = 0; i < Math.pow(undersampledSize, 3) ; i++) {
        //min
        undersampled_A.push(maxImageValue);
        //max
        undersampled_A.push(0);
    }

    //Krok v indexe textur po ktorom by mal ist bunka podvzorkovaneho datasetu
    //var step = (maxSize / ((maxSize / sizeInZ) / undersampledSize));
    //var step = (maxSize * sizeInZ * undersampledSize);
    var step = maxSize / undersampledSize;
    var indexStep = step/sizeInZ;

    var actualPosition = step;
    var startIndex = 0;
    var stopIndex = Math.ceil(indexStep);
    x = 0, y = 0, z = 0;
    for (var actualPosition = 0; actualPosition < 1 ;) {
        imageData_A = [];
        //Ulozenie dat spracovanych obrazkov
        for (var i = startIndex; dataImages[dataSetIndex][i] && i <= stopIndex ; i++) {
            var context = dataImages[dataSetIndex][i].getContext("2d");
            var imageData = context.getImageData(0, 0, imageSize, imageSize);
            imageData_A.push(imageData);
        }
        if (imageData_A.length == 0)
            break;


        //pocet obrazkov ktore budem spracuvat
        var imagesCount = Math.min(stopIndex - startIndex + 1, maxImages - startIndex);

        //counter - xii
        var xii = 0;
        var yii = 0;
        //Zapisovanie informacii
        for (var i = 0; i < imageData_A[0].data.length; i += 4) {
            for (var imageX = 0; imageX < imagesCount &&  imageData_A[imageX] ; imageX++) {
                if(undersampled_A[usIndex] > imageData_A[imageX].data[i+1])
                    undersampled_A[usIndex] = imageData_A[imageX].data[i+1];
                if(undersampled_A[usIndex+1] < imageData_A[imageX].data[i+1])
                    undersampled_A[usIndex+1] = imageData_A[imageX].data[i+1];
            }

            //vypocet indexu
            //Ak sa meni hodnota v X
            xii++;
            if (xii >= boxResolution) {
                x++;
                //Ak sa meni hodnota v Y
                if (x >= undersampledSize) {
                    yii++;
                    if (yii >= boxResolution) {
                        y++;
                        //Vynulovanie ak sa presla cela plocha
                        //vtedy by sa malo vyskocit
                        if (y >= undersampledSize) {
                            y = 0;
                        }
                        yii = 0;
                    }
                    x = 0;
                }
                xii = 0;
                usIndex = (z * undersampledSize * undersampledSize + (y * undersampledSize + x)) * 2;
            }
        }

        //nastavenie pre posunutie v Z osi
        z++;
        actualPosition += step;
        startIndex = Math.floor(indexStep * z);
        stopIndex = Math.ceil(indexStep * z + indexStep);
    }

    return undersampled_A;
}



function getFileNames(pathDir, maxCount, StartIndex) {
    var fileNames = [];

    for (var i = StartIndex; i < maxCount; i++) {
        fileNames.push(pathDir + "IM-0001-" + pad(i + 1, 4) + ".png");
    }

    return fileNames;
}

var _getAllFilesFromFolder = function (dir) {

    var filesystem = require("fs");
    var results = [];

    filesystem.readdirSync(dir).forEach(function (file) {

        file = dir + '/' + file;
        var stat = filesystem.statSync(file);

        if (stat && stat.isDirectory()) {
            results = results.concat(_getAllFilesFromFolder(file))
        } else results.push(file);

    });

    return results;

};

function pad(num, size) {
    var s = "000000000" + num;
    return s.substr(s.length - size);
}