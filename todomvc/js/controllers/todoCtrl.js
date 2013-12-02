/*global todomvc, angular */
'use strict';

/**
 * The main controller for the app. The controller:
 * - retrieves and persists the model via the todoStorage service
 * - exposes the model to the template and provides event handlers
 */
todomvc.controller('TodoCtrl', function TodoCtrl($scope, $location, todoStorage, filterFilter, Auth) {
    $scope.todos = [];
    var updateTodos = function () {
        var query = ($location.path() === '/active') ?
        { completed: false } : ($location.path() === '/completed') ?
        { completed: true } : null;

        if (!$scope.admin) {
            if (!query) {
                query = {};
            }
            query.user = $scope.username;
        }

        todoStorage.query(query, function (todos) {
            $scope.todos = todos || [];
        }, function () {
            $scope.todos = [];
        });
    }

    $scope.auth = Auth;
    $scope.username = Auth.username;
    $scope.admin = Auth.hasResourceRole('admin');

    updateTodos();

    $scope.newTodo = '';
    $scope.editedTodo = null;

    $scope.$watch('todos', function (newValue, oldValue) {
        $scope.remainingCount = filterFilter($scope.todos, { completed: false }).length;
        $scope.completedCount = $scope.todos.length - $scope.remainingCount;
    }, true);

    if ($location.path() === '') {
        $location.path('/');
    }

    $scope.location = $location;

    $scope.$watch('location.path()', function (newValue, oldValue) {
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
            user: $scope.username
        }, updateTodos);

        $scope.newTodo = '';
    };

    $scope.editTodo = function (todo) {
        $scope.editedTodo = todo;
    };

    $scope.doneEditing = function (todo) {
        if (!$scope.editedTodo) {
            return;
        }

        $scope.editedTodo = null;
        todo.title = todo.title.trim();
        if (!todo.title) {
            todoStorage.remove(todo, updateTodos);
        } else {
            todoStorage.update(todo, updateTodos);
        }
    };

    $scope.revertEditing = function (todo) {
        updateTodos();
    };

    $scope.removeTodo = function (todo) {
        todoStorage.remove(todo, updateTodos);
    };

    $scope.updateTodo = function (todo) {
        todoStorage.update(todo, updateTodos);
    };

    $scope.clearCompletedTodos = function () {
        var completed = filterFilter($scope.todos, { completed: true });
        var tasks = completed.length;
        for (var i = 0; i < completed.length; i++) {
            todoStorage.remove(completed[i], function () {
                tasks--;
                if (tasks == 0) {
                    updateTodos();
                }
            })
        }
    };

    $scope.markAll = function (completed) {
        var tasks = $scope.todos.length;
        for (var i = 0; i < $scope.todos.length; i++) {
            $scope.todos[i].completed = completed;
            todoStorage.update($scope.todos[i], function () {
                tasks--;
                if (tasks == 0) {
                    updateTodos();
                }
            });
        }

    };

    $scope.refresh = function () {
        updateTodos();
    }
});


todomvc.controller('AttackCtrl', function AttackCtrl($scope, $injector, todoStorage, Auth) {
    $scope.username = Auth.username;
    $scope.admin = Auth.hasResourceRole('admin');
    $scope.authorization = true;

    var originalToken = window._oauth.token;
    var originalTodoStorage = angular.copy(todoStorage);

    $scope.attack = function () {
        if ($scope.authorization) {
            window._oauth.token = originalToken;
        } else {
            delete window._oauth.token;
        }

        todoStorage.query = function (query, success, error) {
            if ($scope.admin && query) {
                delete query.user;
            } else if ($scope.username) {
                query.user = $scope.username;
            }

            originalTodoStorage.query(query, success, error);
        }

        todoStorage.save = function (todo, success, error) {
            if ($scope.username) {
                todo.user = $scope.username;
            }

            originalTodoStorage.save(todo, success, error);
        }

        $scope.refresh();
    }

    $scope.reset = function () {
        $scope.username = $scope.attack.username = Auth.username;
        $scope.admin = $scope.attack.admin = Auth.hasResourceRole('admin');
        $scope.authorization = true;
        window._oauth.token = originalToken;

        todoStorage.query = originalTodoStorage.query;
        todoStorage.save = originalTodoStorage.save;

        $scope.refresh();
    }
});