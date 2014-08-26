// A simple script to read out a message containing the request path when
// every resource under this application is read.
//
// This example shows how to:
// 1) Use the preRead and postRead functions
// 2) Get the request path from the request and response objects

function preRead(request, libraries) {
	print("Hello incoming request for " + request.path);
}

function postRead(response, libraries) {
	print("Goodbye outgoing response for " + response.request.path);
}

