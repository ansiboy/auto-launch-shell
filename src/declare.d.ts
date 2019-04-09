interface Require {

	/**
	* Configure require.js
	**/
	config(config: RequireConfig): Require;

	/**
	* CommonJS require call
	* @param module Module to load
	* @return The loaded module
	*/
	(module: string): any;

	/**
	* Start the main app logic.
	* Callback is optional.
	* Can alternatively use deps and callback.
	* @param modules Required modules to load.
	**/
	(modules: string[]): void;

	/**
	* @see Require()
	* @param ready Called when required modules are ready.
	**/
	(modules: string[], ready: Function): void;

	/**
	* @see http://requirejs.org/docs/api.html#errbacks
	* @param ready Called when required modules are ready.
	**/
	(modules: string[], ready: Function, errback: Function): void;

	/**
	* Generate URLs from require module
	* @param module Module to URL
	* @return URL string
	**/
	toUrl(module: string): string;

	/**
	* Returns true if the module has already been loaded and defined.
	* @param module Module to check
	**/
	defined(module: string): boolean;

	/**
	* Returns true if the module has already been requested or is in the process of loading and should be available at some point.
	* @param module Module to check
	**/
	specified(module: string): boolean;

	/**
	* On Error override
	* @param err
	**/
	onError(err: RequireError, errback?: (err: RequireError) => void): void;

	/**
	* Undefine a module
	* @param module Module to undefine.
	**/
	undef(module: string): void;

	/**
	* Semi-private function, overload in special instance of undef()
	**/
	onResourceLoad(context: Object, map: RequireMap, depArray: RequireMap[]): void;
}

interface RequireError extends Error {

	/**
	* The error ID that maps to an ID on a web page.
	**/
	requireType: string;

	/**
	* Required modules.
	**/
	requireModules: string[] | null;

	/**
	* The original error, if there is one (might be null).
	**/
	originalError: Error;
}

/**
*
**/
interface RequireMap {

	/**
	*
	**/
	prefix: string;

	/**
	*
	**/
	name: string;

	/**
	*
	**/
	parentMap: RequireMap;

	/**
	*
	**/
	url: string;

	/**
	*
	**/
	originalName: string;

	/**
	*
	**/
	fullName: string;
}

interface RequireConfig {

	/**
	* The root path to use for all module lookups.
	*/
	baseUrl?: string;

	/**
	* Path mappings for module names not found directly under
	* baseUrl.
	*/
	paths?: { [key: string]: any; };


	/**
	* Dictionary of Shim's.
	* Can be of type RequireShim or string[] of dependencies
	*/
	shim?: { [key: string]: RequireShim | string[]; };

	/**
	* For the given module prefix, instead of loading the
	* module with the given ID, substitude a different
	* module ID.
	*
	* @example
	* requirejs.config({
	*	map: {
	*		'some/newmodule': {
	*			'foo': 'foo1.2'
	*		},
	*		'some/oldmodule': {
	*			'foo': 'foo1.0'
	*		}
	*	}
	* });
	**/
	map?: {
		[id: string]: {
			[id: string]: string;
		};
	};

	/**
	* Allows pointing multiple module IDs to a module ID that contains a bundle of modules.
	*
	* @example
	* requirejs.config({
	*	bundles: {
	*		'primary': ['main', 'util', 'text', 'text!template.html'],
	*		'secondary': ['text!secondary.html']
	*	}
	* });
	**/
	bundles?: { [key: string]: string[]; };

	/**
	* AMD configurations, use module.config() to access in
	* define() functions
	**/
	config?: { [id: string]: {}; };

	/**
	* Configures loading modules from CommonJS packages.
	**/
	packages?: {};

	/**
	* The number of seconds to wait before giving up on loading
	* a script.  The default is 7 seconds.
	**/
	waitSeconds?: number;

	/**
	* A name to give to a loading context.  This allows require.js
	* to load multiple versions of modules in a page, as long as
	* each top-level require call specifies a unique context string.
	**/
	context?: string;

	/**
	* An array of dependencies to load.
	**/
	deps?: string[];

	/**
	* A function to pass to require that should be require after
	* deps have been loaded.
	* @param modules
	**/
	callback?: (...modules: any[]) => void;

	/**
	* If set to true, an error will be thrown if a script loads
	* that does not call define() or have shim exports string
	* value that can be checked.
	**/
	enforceDefine?: boolean;

	/**
	* If set to true, document.createElementNS() will be used
	* to create script elements.
	**/
	xhtml?: boolean;

	/**
	* Extra query string arguments appended to URLs that RequireJS
	* uses to fetch resources.  Most useful to cache bust when
	* the browser or server is not configured correctly.
	*
	* @example
	* urlArgs: "bust= + (new Date()).getTime()
	*
 	* As of RequireJS 2.2.0, urlArgs can be a function. If a
	* function, it will receive the module ID and the URL as
	* parameters, and it should return a string that will be added
	* to the end of the URL. Return an empty string if no args.
	* Be sure to take care of adding the '?' or '&' depending on
	* the existing state of the URL.
	*
	* @example

	* requirejs.config({
	* 	urlArgs: function(id, url) {
	* 		var args = 'v=1';
	*		if (url.indexOf('view.html') !== -1) {
	* 			args = 'v=2'
	* 		}
	*
	*		return (url.indexOf('?') === -1 ? '?' : '&') + args;
	* 	}
	* });
	**/
	urlArgs?: string | ((id: string, url: string) => string); 

	/**
	* Specify the value for the type="" attribute used for script
	* tags inserted into the document by RequireJS.  Default is
	* "text/javascript".  To use Firefox's JavasScript 1.8
	* features, use "text/javascript;version=1.8".
	**/
	scriptType?: string;

	/**
	* If set to true, skips the data-main attribute scanning done
	* to start module loading. Useful if RequireJS is embedded in
	* a utility library that may interact with other RequireJS
	* library on the page, and the embedded version should not do
	* data-main loading.
	**/
	skipDataMain?: boolean;

	/**
	* Allow extending requirejs to support Subresource Integrity
	* (SRI).
	**/
	onNodeCreated?: (node: HTMLScriptElement, config: RequireConfig, moduleName: string, url: string) => void;
}

interface RequireShim {

	/**
	* List of dependencies.
	**/
	deps?: string[];

	/**
	* Name the module will be exported as.
	**/
	exports?: string;

	/**
	* Initialize function with all dependcies passed in,
	* if the function returns a value then that value is used
	* as the module export value instead of the object
	* found via the 'exports' string.
	* @param dependencies
	* @return
	**/
	init?: (...dependencies: any[]) => any;
}

declare var requirejs: Require;