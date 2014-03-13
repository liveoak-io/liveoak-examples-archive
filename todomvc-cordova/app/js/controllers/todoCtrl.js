/*global todomvc, angular */
'use strict';

/**
 * The main controller for the app. The controller:
 * - retrieves and persists the model via the todoStorage service
 * - exposes the model to the template and provides event handlers
 */
todomvc.controller('TodoCtrl', function TodoCtrl($scope, $location, todoStorage, filterFilter, LiveOak) {
    $scope.todos = [];
    $scope.editedTodoOrig = [];

    var updateTodos = function () {
        var query = ($location.path() === '/active') ?
        { completed: false } : ($location.path() === '/completed') ?
        { completed: true } : null;

        if (!$scope.showAll) {
            if (!query) {
                query = {};
            }
            query.user = $scope.user;
        }

        todoStorage.query(query, function (todos) {
            $scope.todos = todos;
        });
    }

    $scope.auth = LiveOak.auth;
    $scope.user = LiveOak.auth.subject;

    var profile = LiveOak.auth.idToken;
    if (profile.given_name && profile.family_name) {
        $scope.displayName = profile.given_name + ' ' + profile.family_name;
    } else if (profile.given_name) {
        $scope.displayName = profile.given_name;
    } else if (profile.family_name) {
        $scope.displayName = profile.family_name;
    } else {
        $scope.displayName = profile.preferred_username;
    }

    $scope.showAll = LiveOak.auth.hasResourceRole('admin');

    $scope.allChecked = false;

    updateTodos();

    $scope.newTodo = '';
    $scope.editedTodo = null;

    $scope.$watch('todos', function (newValue, oldValue) {
        $scope.remainingCount = filterFilter($scope.todos, { completed: false }).length;
        $scope.completedCount = $scope.todos.length - $scope.remainingCount;
        $scope.allChecked = filterFilter($scope.todos, { completed: false}) == 0;
    }, true);

    if ($location.path() === '') {
        $location.path('/');
    }

    $scope.location = $location;

    $scope.$watch('location.path()', function (newValue, oldValue) {
        if (newValue === '') {
            newValue = '/';
        }

        if (newValue != oldValue) {
            updateTodos();
        }
    });

    $scope.addTodo = function () {
        var newTodo = $scope.newTodo.trim();
        if (!newTodo.length) {
            return;
        }

        todoStorage.save({
            title: newTodo,
            completed: false,
            user: $scope.user
        }, function (todo) {
            $scope.todos.push(todo);
        });

        $scope.newTodo = '';
    };

    $scope.editTodo = function (todo) {
        $scope.editedTodo = todo;

        var i = $scope.todos.indexOf(todo);
        $scope.editedTodoOrig[i] = angular.copy(todo);
    };

    $scope.doneEditing = function (todo) {
        if (!$scope.editedTodo) {
            return;
        }

        $scope.editedTodo = null;
        todo.title = todo.title.trim();
        if (!todo.title) {
            $scope.removeTodo(todo);
        } else {
            $scope.updateTodo(todo);
        }
    };

    $scope.revertEditing = function (todo) {
        var i = $scope.todos.indexOf(todo);
        if ($scope.editedTodoOrig[i]) {
            $scope.todos[i] = $scope.editedTodoOrig[i];
        }
        $scope.editedTodo = null;
        $scope.editedTodoOrig[i] = null;
    };

    $scope.updateTodoCompletionStatus = function (todo) {
        var i = $scope.todos.indexOf(todo);
        $scope.editedTodoOrig[i] = angular.copy(todo);
        // Checkbox state changed, so original todo.completed is equal to opposite in UI
        $scope.editedTodoOrig[i].completed = !todo.completed;

        $scope.updateTodo(todo);
    };

    $scope.removeTodo = function (todo) {
        todoStorage.remove(todo, function () {
            $scope.todos.splice($scope.todos.indexOf(todo), 1);
        });
    };

    $scope.updateTodo = function (todo) {
        todoStorage.update(todo, function (updated) {
            $scope.todos[$scope.todos.indexOf(todo)] = updated;
        }, function(error) {
            // Update was not successful,so we need to revert todo in UI to editedTodoOrig (original value)
            var i = $scope.todos.indexOf(todo);
            if ($scope.editedTodoOrig[i]) {
                $scope.todos[i] = $scope.editedTodoOrig[i];
            }
        });
    };

    $scope.clearCompletedTodos = function () {
        var completed = filterFilter($scope.todos, { completed: true });
        var tasks = completed.length;
        for (var i = 0; i < completed.length; i++) {
            $scope.removeTodo(completed[i]);
        }
    };

    $scope.markAll = function () {
        $scope.allChecked = !$scope.allChecked;
        for (var i = 0; i < $scope.todos.length; i++) {
            if ($scope.todos[i].completed != $scope.allChecked) {
                $scope.todos[i].completed = $scope.allChecked;
                $scope.updateTodoCompletionStatus($scope.todos[i]);
            }
        }
    };

    $scope.refresh = function () {
        updateTodos();
    }

    $scope.userLabel = function() {
        var role = "";
        if ($scope.auth.hasResourceRole("admin")) {
            role = "admin";
        } else if ($scope.auth.hasResourceRole("user")) {
            role = "user";
        }
        return $scope.displayName + " (" + role + ")";
    }
});