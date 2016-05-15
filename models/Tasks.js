var mongoose = require('mongoose');

//configuration of a Task data model
var TaskSchema = new mongoose.Schema({
    body: String,
    status: { type: Boolean, default: false },
    priority: Number,
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project'}
});

mongoose.model('Task', TaskSchema);