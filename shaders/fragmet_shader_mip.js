uniform sampler2D frontFace;
uniform sampler2D backFace;

uniform sampler2D volume1;
uniform sampler2D volume2;
uniform sampler2D volume3;
uniform sampler2D volume4;
uniform sampler2D volume5;
uniform sampler2D volume6;
uniform sampler2D volume7;
uniform sampler2D volume8;

uniform vec2 size;
uniform float alphaMultiplier;
uniform int cntInRow;
uniform float step;
uniform float zSize;
vec3 direction;

int textureIndex = 0;

vec2 mappingFce(vec3 position, int sideCnt){
    float partSide = float(1) / float(sideCnt);

    int imgCount = int(position.z * (float(1) / zSize));

    int yMul = int(imgCount / sideCnt);
    int xMul = int(imgCount - (yMul*sideCnt));

    textureIndex = yMul/sideCnt;
    yMul -= textureIndex*sideCnt;

    float xPos = (position.x / float(sideCnt)) + (partSide * float(xMul));
    float yPos = (position.y / float(sideCnt)) + (partSide * float(yMul));

    return vec2(xPos, yPos);
}

vec4 getColor(vec2 pos){

    if(textureIndex == 0)
        return texture2D(volume1, pos.xy);
    if(textureIndex == 1)
        return texture2D(volume2, pos.xy);
    if(textureIndex == 2)
        return texture2D(volume3, pos.xy);
    if(textureIndex == 3)
        return texture2D(volume4, pos.xy);
    if(textureIndex == 4)
        return texture2D(volume5, pos.xy);
    if(textureIndex == 5)
        return texture2D(volume6, pos.xy);
    if(textureIndex == 6)
        return texture2D(volume7, pos.xy);
    if(textureIndex == 7)
        return texture2D(volume8, pos.xy);

    return vec4(0.);
}

vec4 getFilteredColor(vec3 position, float partSide){
    float zAxis = position.z * (float(1) / zSize);
    int imgIndex = int(zAxis);

    float colorDiff = zAxis - float(imgIndex);
    float opositeColorDiff = 1. - colorDiff;

    int yOffset = imgIndex / cntInRow;
    //int xOffset = imgIndex - cntInRow * int(floor( float(imgIndex) / float(cntInRow) )); //modulo
    int xOffset = int(mod(float(imgIndex), float(cntInRow)));

    textureIndex = yOffset/cntInRow;
    yOffset -= textureIndex*cntInRow;

    float xPos = (position.x / float(cntInRow)) + (partSide * float(xOffset));
    float yPos = (position.y / float(cntInRow)) + (partSide * float(yOffset));

    vec4 color1 = getColor(vec2(xPos, yPos));

    float interpoledColor = color1.g*opositeColorDiff + color1.b*colorDiff;

    return vec4(interpoledColor,interpoledColor,interpoledColor,1.);
}

void main()
{
    float am = alphaMultiplier/0.004;

    vec4 value = vec4(0.0);

    vec2 fragCoord = gl_FragCoord.xy/size;
    vec3 frontPos = texture2D(frontFace, fragCoord).rgb;
    vec3 backPos = texture2D(backFace, fragCoord).rgb;

    //Preskocenie oblasti ktore niesu v objeme
    if(backPos.x == 0. && backPos.y == 0. && backPos.z == 0.)
    return;

    vec3 path = backPos - frontPos;
    direction = normalize(path);

    vec3 actualPos = frontPos;

    float partSide = float(1) / float(cntInRow);

    float rayDistance = length(path);
    float actualDistance = 0.;

    vec3 diff1 = direction * step;
    float vDiff1 = length(diff1);

    for (int i=0; i < 25000; i++) {

        if(actualDistance > rayDistance || actualPos.x > 1.0 || actualPos.x < 0.0 || actualPos.y > 1.0 || actualPos.y < 0.0 || actualPos.z > 1.0 || actualPos.z < 0.0 || value.g == 1.)
            break;

        vec4 v = getFilteredColor(actualPos.xyz, partSide);

        if(v.g > value.g)
        {
            value = v;
        }

        actualPos += diff1;
        actualDistance += vDiff1;
    }

    gl_FragColor = vec4(value.g, value.g, value.g, 1.);
}