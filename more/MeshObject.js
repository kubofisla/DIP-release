MeshObject = function (sceneObject, distance) {
    //Public properties
    this.SceneObject = sceneObject;
    this.Distance = distance;

    //Public methods
    MeshObject.prototype.SetDistance = function (vector) {
        if (this.SceneObject.geometry.vertices.length == 0)
            return;

        var distVector = this.SceneObject.geometry.vertices[0].clone()
        distVector.sub(vector);

        this.Distance = distVector.length();
    }
}