var mongoose = require('mongoose');

//configuration of a Project data model
var ProjectSchema = new mongoose.Schema({
    title: String,
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    user: String
});

mongoose.model('Project', ProjectSchema);
