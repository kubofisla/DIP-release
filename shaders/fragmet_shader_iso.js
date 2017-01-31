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
uniform int textureSide;
uniform float texelSize;

uniform float intensityTreshold;
uniform vec3 lightPos;

const float AmbientContribution = 0.15;
const float SpecularContribution = 0.25;
const float DiffuseContribution = 1.0 - SpecularContribution - AmbientContribution;
//const vec3 lightPos = vec3(10., -10., -10.);

float zCount;

vec3 direction;
int textureIndex = 0;
float partSide;

float actualIntensity;
vec3 lightVec;
vec4 actualPoint;
vec4 top, bottom, left, right, front;

float xPos, yPos;

int imgIndex;
float colorDiff;
float opositeColorDiff;

float sizeTextelX;
float sizeTextelY;
int counter;

vec4 getDensity(vec2 pos){

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

void mappingFceActual(vec3 position){
    imgIndex = int(floor(position.z * zCount));

    int yOffset = imgIndex / cntInRow;
    int xOffset = imgIndex - (yOffset * cntInRow);

    textureIndex = yOffset/cntInRow;
    yOffset -= textureIndex*cntInRow;

    xPos = (position.x / float(cntInRow)) + (partSide * float(xOffset));
    yPos = (position.y / float(cntInRow)) + (partSide * float(yOffset));

    actualPoint = getDensity(vec2(xPos, yPos));
}

void mappingFceEviroment(vec3 position){
    right = getDensity(vec2(xPos + sizeTextelX, yPos));
    left = getDensity(vec2(xPos - sizeTextelX, yPos));
    top = getDensity(vec2(xPos, yPos + sizeTextelY));
    bottom = getDensity(vec2(xPos, yPos - sizeTextelY));

    int yOffset = (imgIndex+1) / cntInRow;
    int xOffset = imgIndex+1 - (yOffset * cntInRow);

    textureIndex = yOffset/cntInRow;
    yOffset -= textureIndex*cntInRow;

    xPos = (position.x / float(cntInRow)) + (partSide * float(xOffset));
    yPos = (position.y / float(cntInRow)) + (partSide * float(yOffset));
    front = getDensity(vec2(xPos, yPos));
}

float getFilteredColor(float color1, float color2){
    return color1*opositeColorDiff + color2*colorDiff;
}

vec3 getActualNormal(vec3 actualPos){
    //vec3 normalCamera = normalize(lightPos);
    vec3 normalCamera = normalize(lightPos - vec3(0.5, 0.5, 0.5));
    float x0 = 1.;
    float x1 = 1.;
    float y0 = 1.;
    float y1 = 1.;
    float z0 = 1.;
    float z1 = 1.;

    if(counter < 1 && actualPos.x < 1.0 && actualPos.x > 0.0 && actualPos.y < 1.0 && actualPos.y > 0.0 && actualPos.z > 0.0 )
    {
        float pom = zCount - float(imgIndex);
        if(pom < 1.)
        {
            front.b = 0.;
            //front.g = 0.;
        }
        else if(pom < 2.)
            front.g = 0.;
        else
        {
            if(normalCamera.x < 0.)
                x0 = 1. - (normalCamera.x * -1.);
            if(normalCamera.x > 0.)
                x1 = 1. - (normalCamera.x);
            if(normalCamera.y < 0.)
                y0 = 1. - (normalCamera.y * -1.);
            if(normalCamera.y > 0.)
                y1 = 1. - (normalCamera.y);
            if(normalCamera.z < 0.)
                z0 = 1. - (normalCamera.z * -1.);
            if(normalCamera.z > 0.)
                z1 = 1. - (normalCamera.z);
        }
    }

    //vec3 gx = x0 * getFilteredColor(left.g, left.b) - x1 * getFilteredColor(right.g, right.b);

    vec3 normal = vec3(     (x0 * getFilteredColor(left.g, left.b) - x1 * getFilteredColor(right.g, right.b)),
                            (y0 * getFilteredColor(bottom.g, bottom.b) - y1 * getFilteredColor(top.g, top.b)),
                            //z0 * getFilteredColor(actualPoint.r, actualPoint.g) - z1 * getFilteredColor(actualPoint.b, actualPoint.a));
                            (z0 * getFilteredColor(actualPoint.r, actualPoint.g) - z1 * getFilteredColor(front.g, front.b)));
    gl_FragColor = vec4(normal.r, normal.g, normal.b, 1.);
                      
    return normalize(normal);
}

float getLightIntensity(vec3 normal){

    float diffuse = clamp(dot(lightVec, normal), 0., 1.);

    //Aj odraz
    float spec = 0.0;
    if (diffuse > 0.0){
        vec3 R = reflect(-lightVec,normal);
        float NdotH = clamp(dot( R, lightVec ), 0., 1.);
        spec = pow(NdotH, 4.0);
    }
    return AmbientContribution + spec*SpecularContribution + diffuse*DiffuseContribution;
}

void comupteColorDiff(vec3 actualPos){
    float zAxis = actualPos.z / zSize;

    colorDiff = zAxis - floor(zAxis);
    //colorDiff = 1.;
    opositeColorDiff = 1. - colorDiff;
}

void main()
{
    zCount = float(1) / zSize;
    partSide = float(1) / float(cntInRow);

    vec4 value = vec4(0.0);

    //Vypocet vstupneho a vystupneho vektoru do datasetu
    vec2 fragCoord = gl_FragCoord.xy/size;
    vec3 frontPos = texture2D(frontFace, fragCoord).rgb;
    vec3 backPos = texture2D(backFace, fragCoord).rgb;

    //Preskocenie oblasti ktore niesu v objeme
    if(backPos.x == 0. && backPos.y == 0. && backPos.z == 0.)
        return;

    vec3 path = backPos - frontPos;
    direction = normalize(path);
    lightVec = -direction;

    vec3 isoColor = vec3(0.004*255., 0.004*224., 0.004*189.);

    vec3 actualPos = frontPos;//

    sizeTextelX = texelSize;
    sizeTextelY = texelSize;

    float rayDistance = length(path);
    float actualDistance = 0.;

    vec3 diff1 = direction * step;
    float vDiff1 = length(diff1);

    float LightIntensity = 1.0;

    for (int i=0; i < 25000; i++) {
        counter = i;
        if(actualDistance > rayDistance || actualPos.x > 1.0 || actualPos.x < 0.0 || actualPos.y > 1.0 || actualPos.y < 0.0 || actualPos.z > 1.0 || actualPos.z < 0.0 )
            break;
        //if(actualDistance > rayDistance)
        //    break;

        mappingFceActual(actualPos);
        comupteColorDiff(actualPos);

        //actualIntensity = actualPoint.g;
        actualIntensity = getFilteredColor(actualPoint.g, actualPoint.b);

        if(actualIntensity > intensityTreshold)
        {
            //value.rgb = isoColor * actualIntensity;
            //shading
            mappingFceEviroment(actualPos);

            //value.rgb = isoColor;
            value.rgb = isoColor * getLightIntensity(getActualNormal(actualPos));
            value.a = 1.;

            break;
        }

        actualPos += diff1;
        actualDistance += vDiff1;
    }
    gl_FragColor = value;
}