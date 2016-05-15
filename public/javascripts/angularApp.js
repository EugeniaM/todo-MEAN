//set up new AngularJS app with ui-router included as dependency
var app = angular.module('todoLists', ['ui.router']);

//ui-router states configuration
app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
    $stateProvider
        .state('home', { //home state
            url: '/home',
            templateUrl:'/home.html',
            controller: 'MainCtrl',
            resolve: { //when home state is entered, the getAll function will be called to get all todo lists of a user
                projetPromise: ['projects', function(projects) {
                    return projects.getAll();
                }]
            }
        })
        .state('addProject', { //state for todo lists
            url: '/addProject',
            templateUrl: '/addProject.html',
            controller: 'AddProjectCtrl'
        })
        .state('editProject', { //state editing todo lists
            url: '/editProject/:id',
            templateUrl: '/editProject.html',
            controller: 'EditProjectCtrl'
        })
        .state('editTask', { //state foe editing tasks
            url: '/project/:idProject/editTask/:idTask',
            templateUrl: '/editTask.html',
            controller: 'EditTaskCtrl'
        })
        .state('login', { //state for logging in
            url: '/login',
            templateUrl: '/login.html',
            controller: 'AuthCtrl',
            onEnter: ['$state', 'auth', function($state, auth) {
                if(auth.isLoggedIn()){
                    $state.go('home');
                }
            }]
        })
        .state('signup', { //state for signing up
            url: '/signup',
            templateUrl: '/signup.html',
            controller: 'AuthCtrl',
            onEnter: ['$state', 'auth', function($state, auth) {
                if(auth.isLoggedIn()) {
                    $state.go('home');
                }
            }]
        });
    $urlRouterProvider.otherwise('home');
}])

//set up MainCtrl controller
app.controller('MainCtrl', ['$scope', '$state', 'projects', 'auth', function($scope, $state, projects, auth) {
    $scope.projects = projects.projects;
    $scope.newTask = {
        body: []
    };
    $scope.isLoggedIn = auth.isLoggedIn;

    //method that redirects to addProject state
    $scope.goToAddNewProjectPage = function(){
        $state.go('addProject');
    };

    //method that redirects to editProject state, requires project id
    $scope.goToEditProjectPage = function(project){
        $state.go('editProject', {id: project._id});
    };

    //method that redirects to editTask state, erquires project id and task id
    $scope.goToEditTaskPage = function(project, task){
        $state.go('editTask', {idProject: project._id, idTask: task._id});
    };

    //method for removing a project, takes project object as an argument
    $scope.removeProject = function (project) {
        projects.removeProject(project._id);
    };

    //method for adding new task to a project, takes project object as an argument
    $scope.addNewTask = function(project){
        var foundIndex = projects.projects.indexOf(project);
        //preventing a user from submitting a new task with a blank body
        if( !$scope.newTask.body[foundIndex] || $scope.newTask.body[foundIndex] === '' ) return;

        //create new task and add it to the appropriate project
        projects.createTask(project._id, {
            body: $scope.newTask.body[foundIndex], //determine a task body
            priority: project.tasks.length //determine a task priority
        }).success(function(task) {
            projects.projects[foundIndex].tasks.push(task); //add a new task to the array of tasks of an appropriate project
        });
        $scope.newTask.body[foundIndex] = '';
    };

    //method for removing a task from a project, takes project object and task object as arguments
    $scope.removeTask = function (project, task) {
        projects.removeTask(project._id, task._id);
    };

    //method for increasing the priority of a task, takes project object and task object as arguments
    $scope.prioritizeUp = function(project, task) {
        projects.prioritizeUp(project._id, task._id, task);
    };

    //method for decreasing the priority of a task, takes project object and task object as arguments
    $scope.prioritizeDown = function(project, task) {
        projects.prioritizeDown(project._id, task._id, task);
    };

    //method for changing the status of a task, takes project object and task object as arguments
    $scope.changeStatus = function(project, task) {
        projects.changeStatus(project._id, task._id, {
            status: task.status
        });
    };
}]);

//set up AddProjectCtrl controller
app.controller('AddProjectCtrl', ['$scope', '$state', 'projects', function($scope, $state, projects) {
    $scope.addNewProject = function(){
        //preventing a user from submitting a new project with a blank title
        if( !$scope.projectTitle || $scope.projectTitle === '' ) return;
        //call createProject function of projects service
        projects.createProject({
            title: $scope.projectTitle
        });
        $scope.projectTitle = '';
        $state.go('home'); //redirect to home state
    };
    $scope.cancel = function(){
        $state.go('home'); //redirect to home state when Cancel button is clicked
    };
}]);

//set up EditProjectCtrl controller
app.controller('EditProjectCtrl', ['$scope', '$state', 'projects', '$stateParams', function($scope, $state, projects, $stateParams) {
    $scope.project = projects.projects.filter(function(value) {
        return value._id === $stateParams.id;
    })[0];
    $scope.projectTitle = $scope.project.title;
    $scope.editProject = function(){
        //preventing a user from submitting a project with a blank title
        if( !$scope.projectTitle || $scope.projectTitle === '' ) return;
        //call editProject function of projects service
        projects.editProject($stateParams.id, {
            title: $scope.projectTitle
        });
        $scope.projectTitle = '';
        $state.go('home'); //redirect to home state
    };
    $scope.cancel = function(){
        $state.go('home'); //redirect to home state when Cancel button is clicked
    };
}]);

//set up EditTaskCtrl controller
app.controller('EditTaskCtrl', ['$scope', '$state', 'projects', '$stateParams', function($scope, $state, projects, $stateParams) {
    $scope.project = projects.projects.filter(function(value) {
        return value._id === $stateParams.idProject;
    })[0];
    $scope.task = $scope.project.tasks.filter(function(value) {
        return value._id === $stateParams.idTask;
    })[0];
    $scope.taskBody = $scope.task.body;
    $scope.editTask = function(){
        //preventing a user from submitting a task with a blank body
        if( !$scope.taskBody || $scope.taskBody === '' ) return;
        //call editTask function of projects service
        projects.editTask($stateParams.idProject, $stateParams.idTask, {
            body: $scope.taskBody
        });
        $scope.taskBody = '';
        $state.go('home'); //redirect to home state
    };
    $scope.cancel = function(){
        $state.go('home'); //redirect to home state when Cancel button is clicked
    };
}]);

app.factory('projects', ['$state', '$http', 'auth', function($state, $http, auth){
    var projectsObject = {
        projects: []
    };

    //method for getting all projects created by the user currently logged in
    projectsObject.getAll = function(){
        return $http.get('/projects').success(function(data) {
            var username = auth.currentUser();
            var userProjects = data.filter(function(project) {
                return project.user === username;
            });
            //copy all received projects to projectsObject.projects array
            angular.copy(userProjects, projectsObject.projects);
        });
    };

    ////method for posting new project to server
    projectsObject.createProject = function(project) {
        return $http.post('/projects', project, {
            headers: {Authorization: 'Bearer '+auth.getToken()} //header for authorization
        }).success(function(data) {
            projectsObject.projects.push(data); //add created project to the array of projects
        });
    };

    //method for a project editing
    projectsObject.editProject = function(id, project) {
        return $http.post('/projects/' + id, project).success(function(data) {
            $.each(projectsObject.projects, function(i, obj) {
                if(obj._id === data._id) { //search for the appropriate project in the array of projects
                    projectsObject.projects[i] = data; //change the appropriate project
                }
            });
        });
    };

    //method that removes a project
    projectsObject.removeProject = function(id){
        return $http.delete('/projects/' + id).success(function(data){
            $.each(projectsObject.projects, function(i, obj){
                if(obj._id === id){ //search for the appropriate project in the array of projects
                    projectsObject.projects.splice(i, 1); //remove the appropriate project
                }
            });
        });
    };

    //method that adds a new task to the project
    projectsObject.createTask = function(id, task) {
        return $http.post('/projects/' + id + '/tasks', task);
    };

    //method that edits a task of the project
    projectsObject.editTask = function(idProject, idTask, task) { //takes project id, task id and task object
        return $http.post('/projects/' + idProject + '/tasks/' + idTask, task).success(function(data) {
            $.each(projectsObject.projects, function(i, obj) {
                if(obj._id === idProject) { //search for the appropriate project in the array of projects
                    $.each(projectsObject.projects[i].tasks, function(j, taskObj) {
                        if(taskObj._id === idTask) { //search for the appropriate task in the array of tasks
                            projectsObject.projects[i].tasks[j] = data; //change the appropriate task
                        }
                    });
                }
            });
        });
    };

    //method that removes a task
    projectsObject.removeTask = function(idProject, idTask) {
        return $http.delete('/projects/' + idProject + '/tasks/' + idTask).success(function(data) {
            $.each(projectsObject.projects, function(i, obj) {
                if(obj._id === idProject) { //search for the appropriate project in the array of projects
                    $.each(projectsObject.projects[i].tasks, function(j, taskObj) {
                        if(!taskObj) return;
                        if(taskObj._id === idTask) { //search for the appropriate task in the array of tasks
                            projectsObject.projects[i].tasks.splice(j, 1); //remove the appropriate task
                        }
                    });
                }
            });
        });
    };

    //method that increases the priority of a task
    projectsObject.prioritizeUp = function(idProject, idTask, task) {
        return $http.put('/projects/' + idProject + '/tasks/' + idTask + '/prioritizeUp').success(function(data) {
            var currentPriority = task.priority;
            var taskDown;
            var taskUp;
            $.each(projectsObject.projects, function(i, obj) {
                if(obj._id === idProject) { //search for the appropriate project in the array of projects
                    $.each(projectsObject.projects[i].tasks, function(j, taskObj) {
                        if(taskObj.priority === currentPriority - 1) {
                            taskDown = taskObj; //determine a task which priority is to be decreased
                        }
                        if(taskObj.priority === currentPriority) {
                            taskUp = taskObj; //determine a task which priority is to be increased
                        }
                    });
                }
            });
            if(!taskDown || ! taskUp) {
                return;
            } else {
                taskDown.priority = currentPriority; //set lower priority to taskDown object
                taskUp.priority = currentPriority - 1; //set higher priority to taskUp object
            }
        });
    };

    //method that decreases the priority of a task
    projectsObject.prioritizeDown = function(idProject, idTask, task) {
        return $http.put('/projects/' + idProject + '/tasks/' + idTask + '/prioritizeDown').success(function(data) {
            var currentPriority = task.priority;
            var taskUp;
            var taskDown;
            $.each(projectsObject.projects, function(i, obj) {
                if(obj._id === idProject) { //search for the appropriate project in the array of projects
                    $.each(projectsObject.projects[i].tasks, function(j, taskObj) {
                        if(taskObj.priority === currentPriority + 1) {
                            taskUp = taskObj; //determine a task which priority is to be increased
                        }
                        if(taskObj.priority === currentPriority) {
                            taskDown = taskObj; //determine a task which priority is to be decreased
                        }
                    });
                }
            });
            if(!taskDown || ! taskUp) {
                return;
            } else {
                taskUp.priority = currentPriority; //set higher priority to taskUp object
                taskDown.priority = currentPriority + 1; //set lower priority to taskDown object
            }
        });
    };

    //method that changes status of a task
    projectsObject.changeStatus = function(idProject, idTask, status) {
        return $http.post('/projects/' + idProject + '/tasks/' + idTask + '/changeStatus', status);
    };

    return projectsObject;
}]);

app.factory('auth', ['$http', '$window', function($http, $window) {
    var auth = {};

    //method that saves a token, takes a token as a parameter
    auth.saveToken = function(token) {
        $window.localStorage['todos-app-token'] = token;
    };

    //method that gets a token
    auth.getToken = function() {
        return $window.localStorage['todos-app-token'];
    };

    //method that determines if the user is logged in
    auth.isLoggedIn = function(){
        var token = auth.getToken();

        if(token){ //if a token exists, check the payload to see if the token has expired
            var payload = JSON.parse($window.atob(token.split('.')[1]));
            return payload.exp > Date.now() / 1000;
        } else { //otherwise assume the user is logged out
            return false;
        }
    };

    //method that determines the current username
    auth.currentUser = function(){
        if(auth.isLoggedIn()){
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload.username;
        }
    };

    //sign up method
    auth.signup = function(user){
        return $http.post('/signup', user).success(function(data) {
            auth.saveToken(data.token); //calls a function that saves a token
        });
    };

    //log in method
    auth.logIn = function(user) {
        return $http.post('/login', user).success(function(data) {
            auth.saveToken(data.token); //calls a function that saves a token
        });
    };

    //log out method
    auth.logOut = function(){
        $window.localStorage.removeItem('todos-app-token');
    };

    return auth;
}]);

//set up AuthCtrl controller
app.controller('AuthCtrl', ['$scope', '$state', 'auth', function($scope, $state, auth) {
    $scope.user = {};

    $scope.signup = function(){
        //calls signup method of auth service
        auth.signup($scope.user).error(function(error) {
            $scope.error = error;
        }).then(function(){
            $state.go('home'); //redirets to home state
        });
    };

    $scope.logIn = function(){
        //calls logIn method of auth service
        auth.logIn($scope.user).error(function(error) {
            $scope.error = error;
        }).then(function(){
            $state.go('home'); //redirets to home state
        });
    };

    $scope.cancel = function(){
        $state.go('home'); //redirets to home state
    };
}]);

app.controller('NavCtrl', ['$scope', 'auth', function($scope, auth) {
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.logOut = auth.logOut;
}]);