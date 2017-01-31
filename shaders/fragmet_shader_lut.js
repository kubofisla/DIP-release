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

uniform sampler2D transferFce;

uniform vec2 size;
uniform float alphaMultiplier;
uniform int cntInRow;
uniform float step;
uniform float zSize;
uniform float texelSize;
uniform vec3 lightPos;
uniform float intensityTreshold;

const float AmbientContribution = 0.15;
const float SpecularContribution = 0.;
const float DiffuseContribution = 1.0 - SpecularContribution - AmbientContribution;

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

void mappingFceActual(vec3 position){
    imgIndex = int(floor(position.z * zCount));

    int yOffset = imgIndex / cntInRow;
    int xOffset = imgIndex - (yOffset * cntInRow);

    textureIndex = yOffset/cntInRow;
    yOffset -= textureIndex*cntInRow;

    xPos = (position.x / float(cntInRow)) + (partSide * float(xOffset));
    yPos = (position.y / float(cntInRow)) + (partSide * float(yOffset));

    actualPoint = getColor(vec2(xPos, yPos));
}

void mappingFceEviroment(vec3 position){
    right = getColor(vec2(xPos + sizeTextelX, yPos));
    left = getColor(vec2(xPos - sizeTextelX, yPos));
    top = getColor(vec2(xPos, yPos + sizeTextelY));
    bottom = getColor(vec2(xPos, yPos - sizeTextelY));

    int yOffset = (imgIndex+1) / cntInRow;
    int xOffset = imgIndex+1 - (yOffset * cntInRow);

    textureIndex = yOffset/cntInRow;
    yOffset -= textureIndex*cntInRow;

    xPos = (position.x / float(cntInRow)) + (partSide * float(xOffset));
    yPos = (position.y / float(cntInRow)) + (partSide * float(yOffset));
    front = getColor(vec2(xPos, yPos));
}

float getFilteredColor(float color1, float color2){
    return color1*opositeColorDiff + color2*colorDiff;
}

vec3 getActualNormal(vec3 actualPos){
    vec3 normalCamera = normalize(lightPos) - vec3(0.5, 0.5, 0.5);
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
            front.b = 0.;
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

    vec3 normal = vec3( x0 * getFilteredColor(left.g, left.b) - x1 * getFilteredColor(right.g, right.b),
                        y0 * getFilteredColor(bottom.g, bottom.b) - y1 * getFilteredColor(top.g, top.b),
                        z0 * getFilteredColor(actualPoint.r, actualPoint.g) - z1 * getFilteredColor(front.g, front.b));
    gl_FragColor = vec4(normalize(normal), 1.);
    return normalize(normal);
}

float getLightIntensity(vec3 actualPos, vec3 normal){
    float diffuse = clamp(dot(lightVec, normal), 0., 1.);

    //float spec = 0.0;
    //if (diffuse > 0.0){
    //    vec3 R = reflect(-lightVec,normal);
    //    float NdotH = clamp(dot( R, lightVec ), 0., 1.);
    //    spec = pow(NdotH, 4.0);
    //}

    return AmbientContribution + diffuse*DiffuseContribution;
}

void comupteColorDiff(vec3 actualPos){
    float zAxis = actualPos.z * zCount;
    int imgIndex = int(zAxis);

    colorDiff = zAxis - float(imgIndex);
    opositeColorDiff = 1. - colorDiff;
}

void main()
{
    counter = 0;
    zCount = float(1) / zSize;

    vec4 value;
    vec4 result = vec4(0.0);

    vec2 fragCoord = gl_FragCoord.xy/size;
    vec3 frontPos = texture2D(frontFace, fragCoord).rgb;
    vec3 backPos = texture2D(backFace, fragCoord).rgb;

    //Preskocenie oblasti ktore niesu v objeme
    if(backPos.x == 0. && backPos.y == 0. && backPos.z == 0.)
    return;

    vec3 path = backPos - frontPos;
    direction = normalize(path);
    lightVec = -direction;

    sizeTextelX = texelSize;
    sizeTextelY = texelSize;

    vec3 actualPos = frontPos;

    partSide = float(1) / float(cntInRow);

    float rayDistance = length(path);
    float actualDistance = 0.;

    vec3 diff1 = direction * step;
    float vDiff1 = length(diff1);

    float LightIntensity = 1.0;

    for (int i=0; i < 25000; i++) {
        counter = i;

        if(actualDistance > rayDistance || actualPos.x > 1.0 || actualPos.x < 0.0 || actualPos.y > 1.0 || actualPos.y < 0.0 || actualPos.z > 1.0 || actualPos.z < 0.0 )
            break;

        mappingFceActual(actualPos);
        comupteColorDiff(actualPos);

        actualIntensity = getFilteredColor(actualPoint.g, actualPoint.b);
        value = texture2D(transferFce, vec2(actualIntensity, 0.5));

        if(value.a > 0.003){
            if(value.a > 0.01 || actualIntensity > intensityTreshold){
                mappingFceEviroment(actualPos);
                LightIntensity = getLightIntensity(actualPos, getActualNormal(actualPos));

                value.rgb = value.rgb * clamp(LightIntensity, 0., 1.);
            }
            if(actualIntensity <= intensityTreshold)
            //if(value.a < 0.9)
                value.a *= alphaMultiplier*125.;
            else
                value.a = 1.0;

            result.rgb = (1.0 - result.a) * value.rgb * value.a + result.rgb;
            result.a = (1.0 - result.a) * value.a + result.a;

            if(result.a >= 0.95)
            {
                result.a = 1.0;
                break;
            }
        }

        actualPos += diff1;
        actualDistance += vDiff1;
    }
    gl_FragColor = result;
}