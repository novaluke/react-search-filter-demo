# Table of Contents

1. [Introduction](#introduction)
1. [Tooling](#tooling)
    1. [TypeScript](#typescript)
        1. [Setup](#setup)
    1. [Babel](#babel)
    1. [Webpack](#webpack)
        1. [`awesome-typescript-loader` vs `ts-loader`](#awesome-typescript-loader-vs-ts-loader)
        1. [`webpack-dev-server`](#webpack-dev-server)
        1. [TypeScript Webpack config](#typescript-webpack-config)
    1. [Linting and prettification](#linting-and-prettification)
        1. [Configuration](#configuration)
    1. [Testing](#testing)
        1. [Configuration](#configuration-1)
    1. [Husky (git hooks)](#husky-git-hooks)
    1. [TODO](#todo)
1. [Approach](#approach)
    1. [Search Input](#search-input)
        1. [A note on testing `react-spring`](#a-note-on-testing-react-spring)
    1. [Filter](#filter)
        1. [Filter (Simple)](#filter-simple)
        1. [Filter (Redux-ish)](#filter-redux-ish)
        1. [Filter (RxJS + `recompose`)](#filter-rxjs--recompose)
    1. [Modular components](#modular-components)
    1. [Custom reflex-inspired FRP solution](#custom-reflex-inspired-frp-solution)
        1. [How it works](#how-it-works)
        1. [Monadic component builder](#monadic-component-builder)
        1. [Streaming outputs](#streaming-outputs)
        1. [Recursive components](#recursive-components)
        1. [Converting back into React-land](#converting-back-into-react-land)
        1. [Custom FRP summary](#custom-frp-summary)
1. [Conclusion](#conclusion)

# Introduction

There are a multitude of complex considerations that go into the creation of a
polished, modern front-end product. [Someone smart once
said](https://www.johndcook.com/blog/2014/11/12/hello-world-is-the-hard-part/)
"'Hello world' is the hard part", and certainly true for modern front-end apps,
despite how often people say that JavaScript is easy to learn or get started
with.

The reality is that to put together a well-built app one has to consider
tooling, transpilation, frameworks, directory layout, testing (from unit to
E2E), continuous integration/delivery, utility libraries for functional
programming, state management, immutability, and so on and so forth.

As a result, a sizeable section of this readme will be focused on how to lay a
good foundation with which to develop with, as well as the techniques and
considerations that go into the development itself.

Note: there is a tool that is popular with the React community (and rightly so)
called `create-react-app`, which can get you up and running with a basic starter
setup. However, it obfuscates a lot of what's going on under the hood, which
makes it harder to learn what it's doing and how to migrate to managing your own
setup. For just exploring it is fine, but for a production-grade app I find it
easier to start from scratch, so there aren't any unseen surprises.

# Tooling

Note: whenever possible, I prefer to us a JavaScript or TypeScript file for
configuration files rather than JSON or other data-only format. By using a
script configuration file it becomes possible to use comments to explain what's
going on or the choices made (especially important as the configuration grows),
and it also allows better autocompletion, as well as linting, and prettification
support. (linting and prettification will be covered below)

## TypeScript

TypeScript, in my opinion, has one of the highest ROIs in terms of adoption cost
vs benefits to both the developer experience and effectiveness, *and*
application robustness. The virtues of a type system like TypeScript's have been
extolled numerous times across the internet, so I'll keep my take brief.
TypeScript is no silver bullet - it definitely has its rough edges, and is
neither as powerful or as robust as type systems in some other languages
(Haskell, for example) - but it does convey a number of definite advantages. The
ones I consider most impactful are:

- Drastically reduced runtime errors (when used well).
- Enhanced IDE support for detecting things like bugs, and typos, as well as
  powerful autocompletion/"Intellisense" (ie. better developer experience and
  productivity).
- The ability to [make impossible states
  impossible](https://www.youtube.com/watch?v=IcgmSRJHu_8). In other words,
  ensuring the correctness of your application.
- Automatic documentation *that is forced to stay up to date with the code*.
  Sure, a lot of JS developers will write type annotations in comments for their
  functions, etc, but that has a number of problems. For one, it requires the human to
  be correct, which is just asking for trouble, especially when a compiler could
  just verify it automatically. Code also often gets changed without remembering
  to change the comments, so the documentation is out of date and misleading.
  And, finally, IDEs can't pull in that information - when an IDE provides
  autocompletion for TypeScript it automatically provides the type signature as
  well, automatically providing documentation right then and there.
- Rapid feedback on errors - *before* they reach your users. Better that the
  compiler hits the error than your users do, and better to find out instantly
  after writing the code than having to wait days, weeks, or even months.

### Setup

Install the TypeScript compiler:

```
yarn add --dev typescript
```

TypeScript is configured via a `tsconfig.json` file placed in the root
directory. A starter config can be generated via `yarn typescript --init`.
Some of the more notable choices in this project's config are as follows:

- `"jsx": "react"` - basically enables JSX compilation.
- `baseUrl` and `paths` - allows paths within the project to be imported without
  relative paths. (eg. `import "foo"` instead of `import "../../foo"`)
- `strict` and `no...` - TypeScript is very permissive, by default, to ease
  transitioning from JavaScript. These flags make it more strict.
- `lib` - tells TypeScript to include type definitions for these "lib"s by
  default. However, it's still up to you to polyfill for them if necessary,
  which is why we include Babel (below).

One thing to note is that `node` can't run TypeScript files, so you can't load your
scripts into the REPL or run any executables from npm on your TypeScript files. However,
this can be solved by installing `ts-node`, which when run will act just like
`node`, but with support for TypeScript files.

## Babel

The TypeScript code we're writing makes use of advanced features from ES6.
However, not every browser supports these features, and TypeScript won't
polyfill them for us. That's where Babel comes in. Babel takes a list of
browsers we want to support and then automatically polyfills any features we're
using that those browsers don't support.

Essentially, we get to use the features that make us most effective as
developers, without having to spend any time worrying about browser support.
Babel can be configured via its own configuration file, or within the
`awesome-typescript-loader` Webpack loader (see below). For this simple
project, I've gone with the simple option of configuring it within Webpack, but
for a more complex application a separate file would likely be more appropriate.

## Webpack

Although ES6 is a big step up, the front-end environment has historically been
missing a lot of essentials for solid development, and still does to this day in
a lot of ways. Webpack - and its ecosystem - mitigates that. Minification,
transpilation, bundling, code splitting - Webpack and its loaders and plugins
can handle just about any part of the build process. Which is a good thing,
because the build process can get very complex, depending on the application's
requirements.

A lot of the things that Webpack can do are only needed in advanced use cases,
so I won't go into them all here. However, here's a quick overview of some of
the more commonly needed features that Webpack can provide:

- TypeScript compilation - yes, the TypeScript compiler itself could just take
  care of this. But then you've got a bunch of JS files kicking around and
  you'll need *another* tool to handle minification, concatenation, etc., not to
  mention handling your CSS, etc. The fact that this can be integrated into
  Webpack makes TypeScript work seamlessly with the rest of the ecosystem.
- Dependency management - Webpack will pull in any file that you `import` from
  your entrypoint (your root JS or TS file). *Any* file. This means CSS, fonts,
  images, anything. If `foo.js` should be styled by `foo.css`, then just `import
  "./foo.css"`. This makes dependencies much easier to manage and reason about,
  and keeps them coupled together in a way that makes sense.
- Asset transformation - Most assets aren't suitable for the web in their source
  form. Webpack loaders can take a source file and turn it into a
  production-ready result. This result can then be used in your script (eg.
  importing an HTML file as a string to be used as a template) or injected back
  into the root HTML for your app (eg. inserting CSS as an inline style tag).
  And what's better, loaders are basically just functions, so they can be
  piped together to even greater effect. Translation: Webpack can take source
  files and make them web ready via declarative configuration, and it can do it
  really well, in really advanced ways if need be.

Some notable configuration choices in this app:

### `awesome-typescript-loader` vs `ts-loader`

In order for our Webpack build to be able to pick up and process our TypeScript
files, we need to enable a loader that can load and parse them to JS.
`awesome-typescript-loader` is the easiest way to get started, but for more
advanced use cases `ts-loader` combined with specific complementary loaders or
plugins would provide more control and utility.

### `webpack-dev-server`

Running `webpack-dev-server` will fire up a simple server that serves your
Webpack build results. By default it has live reload enabled for whenever your
files change, but it also supports more advanced features like hot module
reloading (not covered here).

Why use it? Live reload massively increases developer productivity.

### TypeScript Webpack config

The Webpack config is normally JSON or JS. However, by writing it in TypeScript
we can get static typing for our configuration, alerting us if we accidentally
use an incorrect key or configuration options, and giving us typed
autocompletion information - which is especially important given how notorious
Webpack is for being confusing and difficult to use. This feature requires
`ts-node` to be installed.

## Linting and prettification

These are another of the sets of tools that I consider to have a high ROI.
Linters will check your code for errors, and things that might be consider "code
smell"s, for example. The benefits there are fairly unambiguous. Prettification,
on the other hand (which is a term I may have just made up) is about formatting
your code in a uniform style, and is not something everyone is on board with.

There are various reasons that are usually given when advocating for
prettification. However, there is one that I think outshines the others to the
extent that I won't even bother mentioning them here. That reason is that
prettifier tools let you stay focused on *getting the job done* without worrying
about extraneous concerns like the aesthetics of your code.

There are sometimes when I feel like `prettier` makes things worse, but the
beauty of it is that because I'm using `prettier` *I don't have to care*.
Formatting the code in a "better" way is not a decision I have to make, and less
decisions = less decision fatigue = greater developer effectiveness.

Furthermore, both `tslint` (the TypeScript linter) and `prettier`
(prettification for JS and TS) have the ability to automatically "fix" your
code. This means you can write however makes sense at the time (eg. in one
really, really long line if need be, without getting tripped up by newlines,
spacing, etc.) and then just run the tools via an IDE shortcut to wrap things
up. Again, one less concern on the developer leads to greater effectiveness.

### Configuration

Install:

```
yarn add --dev tslint prettier
```

`tslint`'s config file is `tslint.json`. This project uses
`tslint-config-prettier` and `tslint-plugin-prettier` to make `tslint` also run
`prettier` as if it was a native part of `tslint`. This means that you never
have to run `prettier` manually - just `tslint`.

`tslint` is based on enabling/disabling various "rules", and although you can
certainly configure them manually, it's often easier to at least start with a
base configuration. `tslint` allows you to specify multiple base configurations
to inherit from, each overriding the preceding ones, with your own rules
taking final precedence. Note: each configuration will need to be installed via
yarn/npm.

The base configurations - and the specific rules - used in this project are not
written in stone. Linting configuration should be based on *team* opinion, not
*individual* opinion (even if I might rather do things differently, I'd rather
commit to *something* and still be moving forward).

## Testing

I prefer Jest for testing. I'm sure most test runners/frameworks could get the
job done, but there are a number of advantages I appreciate with Jest:

- It's fully-featured. Other setups require multiple libraries (eg.
  Karma+Jasmine, Mocha+Chai+Sinon), but Jest has it all right out of the box.
- It runs tests in parallel. This can be a pain sometimes, but the speed
  outweighs the very rare case where it becomes tricky (slow tests are tests
  that don't get used - especially not for TDD!).
- It's built by Facebook. Not normally a plus, but when working with React,
  sticking within the Facebook ecosystem for the tests as well increases the
  odds of the two working together seamlessly into the future.

### Configuration

```
yarn add --dev jest
```

Jest needs a little extra help working with TypeScript:

```
yarn add --dev ts-jest
```

It will also blow up if you are importing non-JS/TS files in your source code
(eg. CSS). In order to fix it, define a module somewhere that exports a
`process` function that takes a string (the content of the file) and returns a
string (the transformed contents). For example, for loading HTML templates:

```
const htmlLoader = require("html-loader");
module.exports = {
  process(src) { return htmlLoader(src) }
}
```

Then specify that file in as a transformer:

```
module.exports = {
  // ...
  transform: {
    "^.+\\.html$": "<rootDir>/test/helpers/htmlLoader.js"
  },
  // ...
}
```

For testing React, two helpful libraries are `jest-dom/extend-expect` and
`react-testing-library`, which add extra expectations to `expect().to...` and
provide a system for rendering and interacting with components, respectively
(more on usage below).

## Husky (git hooks)

Git hooks allow you to specify a script that will be run before various git
commands, and if the script fails then the git command will pre-emptively abort.
One of the most popular use cases is for ensuring that only code that passes the
tests can be committed or pushed. They are, therefore, extremely useful in
ensuring the robustness of your application. Unfortunately, they are local to
each checkout, rather than being project-wide. Fortunately Husky solves that
problem.

Husky lets you specify which scripts to run in a config file (or in
`package.json`) that gets checked in to the repo, ensuring it's project-wide. In
this project, I have opted for a nicely paranoid option of checking that
linting, testing, *and* building all pass before both a commit *and* a push. In
a project this size the extra time (especially when run in parallel via
`npm-run-all`) doesn't really matter, and the extra safety is always nice, but
in a production project the scripts would need to be adjusted to your use case.

## TODO

Some things that would be good to do in a production-quality project:

- Refine Webpack setup for production use (reduce bundle size via
  tree shaking etc., set up source maps, ensure non-TS assets are optimized properly,
  etc.)
- Refine Webpack setup for development (hot module reloading, source maps)
- Set up a Continuous Integration/Deployment pipeline
- Generate code coverage reports via the CI pipeline (controversial - not
  everyone finds code coverage a useful metric)
- Have precommit/prepush fail if there are any uncommitted files present (don't
  want tests to be passing just because of something that won't be a part of
  that commit, as that's a false positive)

# Approach

When developing something I generally take an iterative approach and use TDD
whenever possible. There are as many different approaches to testing as there
are to development itself, but recently I've found myself agreeing with the
philosophy of the venerable Kent C. Dodds: "The more your tests resemble the way
your software is used, the more confidence they can give
you."[(Twitter)](https://twitter.com/kentcdodds/status/977018512689455106) and
"Write tests. Not too many. Mostly
integration."[(Blog)](https://blog.kentcdodds.com/write-tests-not-too-many-mostly-integration-5e8c7fff591c)

This is different from what a lot of the testing community has been advocating
for many years, and is different both from how I originally learned testing and
how I have been doing testing for most of my career so far. However, I had been
noticing for a while that my tests didn't *actually* prove the application
itself would work - just that the individual parts work in isolation. But unless
you're testing something in a manner that's congruent to how things will work in
reality, you're not actually finding out how it will perform in the real world.
(Imagine taking a fish out of water and testing if its gills work, for example)

So I'd been wondering for a while if it would make sense to move more of the
burden to integration testing. In fact, I started to wonder if it even made
sense to test anything other than the public interface of the system under test
(more to come on what a "public interface" is). However, everything I'd heard
the experts saying pointed to the contrary, so I kept those thoughts on the
backburner. Until I found Kent C. Dodds' recommendations, though, which struck a
chord with my suspicions.

I tried using this approach on
[employee-manager-node](https://github.com/mayhewluke/employee-manager-node),
and was pleased with how that turned out. I was able to write my tests from the
perspective of what should be done, rather than *how* it should be done (in a
sense, the tests became more declarative than imperative). This helped a lot in
the design and documentation aspect of TDD. It also saved time - I wrote fewer
integration tests than I would have unit tests, and yet had just as much
verification of correctness.

So all that said, how would I explain my actual approach? Well, first of all,
focus on testing the public interface of the system under test. The notion of
public interface differs depending on the context, though. For a UI element,
this might be how the user interacts with it - clicking, typing, etc. For a
library, it would be the publicly usable methods, properties, etc. If you have
comprehensive coverage of the public interface, then you'll have comprehensive
coverage of the internal details as well (and if something internal doesn't get
hit, it's not being used anyway, so it doesn't matter).

Secondly, avoid mocking things unless you have a need to. What constitutes a
need? Well, if it's something non-deterministic then that's likely something
you'll need to mock in order to test effectively - if you can't be sure what all
the inputs to the system are, you can't be sure that your test is asserting on
the right state. Secondly, if it's something that's complex enough to introduce
a number of extra test cases (such as the debounce functionality below), then it
could be worth testing separately and then just testing that the system under
test calls it correctly. Also, if it's something that's slow you'll want to mock
it, as having a responsive test suite is critical (though this is less important
with a test runner that is smart about only running tests affected by whatever
change you've made). And of course, you'll usually want to mock any external
resource - such as a database or a server. (Note that "mock" doesn't always mean
to switch out the function calls with fake ones - spinning up an Express server
with stubbed out endpoints could be a valid way to mock)

Of course, like anything I think I know today, I know I'll "know better" the
next, so this is merely a tentative philosophy that I expect will change, grow,
or maybe even turn out to be worse than before. At this point it is still
something I'm working out the details of, but it's worked well for me so far,
and I believe worked well for this project - with more details of its benefits
below.

## Search Input

I started with the search input because the most basic implementation of it
wouldn't require any inputs, and the smaller the public interface of a component
the easier it often is to get started (plus its output would fuel the Filter
component, so starting with the search input would help there as well).

However, I didn't use TDD at first. Like any tool, TDD isn't always the right
tool for the job. For example, TDD involves specifying up front how things
should work, but that's only possible if you know *how* to specify that. Since
this was my first time using `react-test-library` for full rendering and
interaction with components (having used Enzyme and shallow rendering in the
past), I wasn't familiar enough with the test library to know how to write the
tests properly. Instead, I got some a couple basic features of the search input
built and verified manually, then used that to verify that my tests were written
correctly. From there, once I could be confident that I was writing the proper
tests, I could switch back to TDD.

At first glance the requirements of the search input may seem fairly trivial.
However, if there's one thing I've learned in the last half decade as a
developer, it's that the devil's always in the details - and that the difference
between good and great is as well. At first, I focused on getting the
expand/close animation working via the `react-spring` library. `react-spring`
provides performant spring-based animations with a simple and declarative API.

Since the component needs to keep track of whether it's open or closed, it needs
some way to manage its own state. Normally I'd reach for something like Redux
and implement the component as a Redux-connected Stateless Functional Component
(SFC). However, this is meant to be used in a library, and Redux doesn't lend
itself well to having library components hooked up. This is due to it expecting
to have all state managed in a global store in the root application, in contrast
to a library component which specifically needs to be uncoupled from the root
application. It would probably be possible to hook up Redux to just the search
component and export the whole thing, but that seemed too heavy-handed for a
simple library component, and it's good to avoid extra dependencies in
libraries, if possible. Fortunately it's a simple enough component that a using
a class-based component is still manageable in this case.

Once the main happy path has been built, it's important to think through all the
possible paths:

- The input expands/contracts when the user clicks into the input. What about
  when they tab into it? --> change the test to use the `focus` event instead of
  `click`.
- The input animates when the user focuses the input. What happens if they click
  the icon? With a simple implementation, nothing would happen. But as a user,
  if I was to click on a search icon, I'd expect that to move me closer to being
  able to search somehow. --> add the icon to the input's label so that clicking
  it focuses the input.
- What about the initial state of the input? That should be specified. --> test
  that it starts closed
- The input closes when focus is lost. But what if there's text in there? Losing
  the information that text has been entered could lead to unexpected (from a
  user's perspective) behaviour, and if the input isn't set to close 100% having
  a small amount of cut-off text is visually unpleasant. --> test that it only
  closes if empty
- The input shows an "X" icon when text has been entered.
  What happens if a user clicks on that icon? I'd expect an icon associated with
  a form to have an action, and "X" generally means cancellation of some sort.
  --> test that the "X" icon clears the input

Ok, so that covers a lot of the paths, and should round out the UX nicely. But
this is intended to be used as a library component, and all of its behaviour is
currently hard-coded. For example, it's set to have the border, icon, and text
be white (based on a blue background), but can we assume that it will always be
on a blue background? No, so let's make the color be an input to the component
via its props. What if it's placed in a container of a different size? Make the
closed and open widths inputs (props) as well. And finally, let's think about
outputs - an input is no use if no one knows what's been input into it. So in
the spirit of React's one-way binding, accept a callback input for when the text
changes.

### A note on testing `react-spring`

`react-spring` - being an animation library - relies on elapsed time, which is
obviously problematic when testing. There are a number of ways one could try to
solve this (using jest.useFakeTimers, for example), but fortunately
`react-spring`s API provides us the tools we need. If we just set
`immediate={true}` then animations will take place immediately, and we can
immediately test that the desired state has been reached.

However, our production code doesn't use `immediate` - for obvious reasons.
Fortunately Jest provides us the ability to monkey-patch modules before they're
used in tests. A quick patch of replacing the `Spring` class with a function
that returns a `Spring` with `immediate` set solves the problem well (see
`__mocks__/react-spring.tsx`.

## Filter

My first thought when considering implementing the Filter component was that a
single component that handles sending a request to an API, pulling the data out,
and then displaying it is a component that's trying to do too much. I would want
to first ask myself if the data can be passed in from a parent component via
props, and then the Filter can just be a List component instead. In fact, if
this was to be another library component, it would likely need to have a
configurable endpoint. And at that point, it would be accepting a URL and a
query string - in which case the function that hits the API endpoint might as
well be extracted into a separate function. From there the parent component
could just call the function and pass the result to the component. This would
result in the request functionality still being abstracted away as part of the
library, but without having to have all the functionality in a single component.

However, without knowing more about the rest of the application or the possible
use cases for the component, it's not easy to come up with a good way to address
these concerns (half of success is knowing what problem you're trying to solve,
after all). So I wanted to build all the functionality into a single component
anyway, despite the challenge, to show how cleanly it can be done.

Ironically, even though the Filter seems simpler than the search input (just
send a request and display the response, right?), handling async requests well
tends to get complex fast. The combination of possible states escalates
quickly, especially when considering potential differences between subsequent
requests after the first.

Now, knowing that this is something that will likely be more complicated than
it appears, and knowing that state management will be a large part of the
complexity, I might be tempted to spend a long time trying to figure out the
best way to approach the situation. For example, normally I'd want to [make impossible
states impossible](https://www.youtube.com/watch?v=IcgmSRJHu_8) via the type
system (similar to what I did with
[employee-manager-react-native](https://github.com/mayhewluke/employee-manager-react-native/blob/master/src/store/common/Async.ts)),
and bring in a state management library like Redux or RxJS+recompose (which
aren't technically state management libraries, but I digress). However, once
again I didn't want to get too heavy-handed at this point with what might be a
library component.

Instead, my preferred approach in situations like this is to take an iterative
approach. First, specify as much as possible via tests. Then hack together
anything that'll get the job done (ie. the tests pass). Expand on the tests if
you discover that there are things you hadn't thought of at first. Then, once
you've got a fully fleshed out specification (via tests) and a Frankenstein
monstrosity that passes them, refactor as necessary (refactor tests first, then
production code). This system helps avoid paralysis by analysis and gets
something out the door to create value ASAP. Then the technical debt used to
fund the creation of that value can be paid off later, when it makes sense to
and when you've got a better idea of how to do so (let's face it, even if you'd
thought harder at first you'd still need to refactor afterwards anyway).

### Filter (Simple)

*(this code viewable on the `filter-simple` branch)*

The first rendition of the Filter component simply used a naive, straightforward
class-based approach. There are a lot of different paths besides the happy path
to consider for this component:

- `query` could be initialized as blank, or as a value. If it's a value, we need
  to kick off a request right away, but if it's blank we need to do nothing and
  display nothing.
- When said request is in progress, we need to provide a visual indication of
  that.
- When said request completes, we need to *remove* the loading indication, *and*
  display the results.
- What about when the results come back empty? The API we're using returns
  `null` instead of `[]`, so that case needs to be handled.
- When results come back empty, we can't just show the user nothing. Showing
  nothing is the state the user will see if they've never sent a request, so
  "never sent a request" will be the association if we show nothing. Instead, we
  need to give them an indicator that the request was sent, it did not error,
  but we didn't get any matches. --> hide the spinner and show a "no results
  found" message
- When the result fails, we need to hide the spinner and show an error message.
  Include the query string used in the request in the message so the user can
  have confidence that the system did do what it wanted, and so that they can
  provide better info if they need to submit an error report.
- What happens if the query changes after already getting a success/error from
  before? Does the error message stay up? Do the previous results stay up? Does
  the "no results found" message stay up?
- On a second request, remove any previous error message. Having an "in
  progress" *and* an "error" message at the same time is unclear to the user -
  is the error for the previous request? Current request? Furthermore, if the
  same error message needs to be displayed after the request completes, the user
  will see no change and won't be sure if anything happened or not.
- On a second request, remove any "no results found" message. Again, "no results
  found" and "loading" is a confusing combination.
- On a second request, keep the previous results up. Keeping them up is not
  confusing to the user - they can see that the results are from their previous
  request, and that new results are being fetched - and removing them before we
  have to could be a negative experience for the user (eg. they were still
  reading the list while waiting for the new request to complete)
- The query could be updated rapidly, for all we know, but we don't want to
  hammer the API with a million requests per second. Therefore we need to
  debounce the requests (and in an ideal world we'd cancel previous in progress
  requests when starting a new one, but I didn't include this in this Filter
  implementation due to time constraints)

So, as expected, lots of hidden complexity when considering the full breadth of
user experience when using Filter. Fortunately the class-based approached didn't
turn out *too* ugly, but it still has the usual problem of having a sort of
spaghetti-code state management (it's difficult to tell when and how state will
be updated, and how actions map to state changes and therefore UI changes - in
other words, it's not clear where inputs come from, nor how they map to
outputs).

In an ideal world, we'd extract out the debouncing functionality to a separate
function which can then be thoroughly tested in isolation, allowing tests for
Filter to stub it out and just check that it's used properly, cutting down on
how many test cases are needed for Filter. We could also make a few
miscellaneous improvements, such as defining the state to be a union type,
helping make impossible states impossible, but I have omitted these improvements
in the interest of time.

### Filter (Redux-ish)

*(this code viewable on the `filter-redux` branch)*

I've said a couple times now that I didn't want to bring Redux in to the
library, as a (possibly over-cautious) concern for the difference in constraints
between a library and a full application. However, Redux is actually remarkably
simple at its core, once you understand the fundamentals, so it's perfectly
possible to mimic Redux within the Filter component without having to bring the
whole library in.

In this case we gain multiple benefits:

- Better separation of concerns:
  - `reducer.tsx` contains everything to do with state: the types involved
    (`State` and `Meal`), as well as the reducer itself (to update the state
    when a new `Action` is received).
  - `actions.tsx` contains a union type defining the possible actions (so that
    we can get type safety, ensuring our reducer doesn't leave out any `case`s,
    etc.), as well as the functions that either create `Action` objects or
    handle running side effects and dispatching the `Action`s themselves. (note
    that the `fetchResults` action function is basically a replication of how
    the popular `redux-thunk` library is used)
  - `Filter.tsx` contains the component itself - so the actual render code, the
    handlers that trigger the action functions, and the code to tie together
    `actions` and `reducer`.
- Clearer picture of how state is updated - any update to state can be traced
  back to a `case` match in `reducer`, and the `Action` that triggered it can be
  traced back to an invocation of a function in `actions.tsx`. In other words,
  we get a clearer picture of where inputs come from (especially with the
  reduced surface area in the class definition), and how they map to outputs.

There are countless resources online explaining in more detail the benefits of
Redux (and the Flux architecture); these are just the ones most pertinent to the
current project. Also note that now we're using the convention of putting all
files relevant to a feature in their own directory, and then exporting the
public members via the `index.ts`.

Once again there are a few drawbacks, however. Perhaps the strongest is that
we're still tied to a class-based component, forcing us to deal with the arcane
lifecycle methods, issues with binding of `this`, etc.

**Tests:**

You may notice that the tests didn't need to be changed at all for the refactor
to this version of Filter. This is a direct benefit of the testing style
described above in the introduction to `Approach`. And in fact, since we didn't
change the public interface of Filter, we should be expecting our tests to not
change. After all, our tests should check that the correct *result* was
achieved, not a specific approach, and since we didn't change those results it
would be a code smell if our tests had to change substantially.

The fact that our tests didn't have to change gives us two huge benefits: first,
it saves us a ton of time on not having to rewrite the tests at all. And two, it
means we don't have to worry about whether or not the changes to the tests ended
up changing what is being tested somehow, and thereby letting some edge case
through. They were correct before, and we are guaranteed they are still correct
now.

### Filter (RxJS + `recompose`)

*(this code viewable on the `filter-rxjs-recompose` branch)*

Functional programming has many benefits, all of which have been extolled
numerous times by others more eloquent than me. However, I will say that
functional programming - and Functional Reactive Programming (FRP) - are, in my
opinion, another one of those things that have a huge impact toward scalable,
robust applications. It certainly takes some time to really wrap your head
around it, but the gains can't be equalled by any other paradigm.

Now, if we assume the library will be for internal use only, and therefore we
can use any library that fits the task, I would strongly consider using RxJS
with `recompose` to write Filter in FRP style.

The benefits:

- More declarative code. This leads to code that's easier to read/comprehend,
  easier to reason about, and easier to write (less overhead in translating
  intent to code - think the difference between a high-level and low-level
  language)
- Like with the Redux example, clearer flow of inputs and outputs
- Debouncing is seamlessly handled for us
- New API requests automatically cancel existing in-progress requests (but only
  for that specific instance of the component - other Filter components will
  operate independently)
- Ability to handle private state without resorting to using a class.
- No need to deal with React's lifecycle methods

Just as with any approach, there are a few caveats, however. For one, this
style has not been as heavily adopted yet by the React community, so there are
fewer guidelines on good architecture. It's also a bigger paradigm shift than
the other options for state management, so it may not be appropriate for every
team.

Note: in an ideal world we'd still optimize a few things a bit further, such as
the directory structure, better typing (once again, making impossible states
impossible), etc. It would also be good to provide better customization by
accepting a `render` prop (a function that takes a `Meal` and renders a list
item), as well as allowing customization of the API URL.

**Tests:**

Unlike the refactor to the Redux style Filter, we did actually have to change
the tests a bit here. This is because Filter changed the library it was using,
so all of the code involving stubbing it out had to be changed as well. This is
one of the reasons why it's valuable to avoid stubbing/mocking whenever
possible, as now we have a lot of lines of test code to go through to check that
nothing was changed incorrectly (though in this case that was unavoidable).

## Modular components

*(this code viewable on the `modular-components` branch)*

As mentioned, although the previous approaches did solve many problems, the
solutions still suffered from a lack of modularity and separation of concerns.
To address this, a fairly large-scale refactor needs to be made (at least in
terms of how much of the existing codebase it touches - the changes themselves
are not especially complex, fortunately).

The changes include:

- Refactoring SearchInput to use `recompose`+`rxjs` as well. This allows for
  sensible semantics for allowing the parent component to reset the search query
  to a specific value by changing the `setValue` prop. This would be useful when
  the query is tied to the route params and the host app navigates to a new
  route, for example.
- Extract the functionality of rendering list items out from `Filter` into a
  `render` prop. This provides better customization of the component while also
  improving separation of concerns.
- Just as the `Filter` shouldn't be in charge of - or hardcode - the rendering
  of list items, it also shouldn't be responsible for what error message is
  shown when an error occurs (only the host knows how it wants to communicate to
  its users, after all). Therefore, extract that functionality out into the
  `errorComponent` prop. Note that in this case the prop is just a component,
  not a render function. This is because the host has access to the error as
  well, and can just update the `errorComponent` prop based on that error,
  rather than having to wrap that functionality up into a function to pass in to
  `Filter`.
- In the same vein, allow the message for when no results are found to also be
  specified by the parent component via `noResultsComponent`.
- Additionally, `Filter` should not be responsible for the API URL to query, nor
  how to extract the data from it. However, a component's responsibility is
  displaying data, not fetching or manipulating it. Therefore, the querying
  functionality can - and should - be extracted to a separate function for the
  host component to use, rather than keeping it within `Filter`. Extracting that
  functionality to `createQueryHandler` provides the parent component with a
  simple to use API for querying and extracting results, with built-in
  debouncing (ideally the debounce interval would be customizable - or
  disable-able, but I have omitted that for the sake of brevity). As a result,
  AsyncList now needs to accept its data via props, utilizing the `AsyncValue`
  type for strong typing. This has the added benefit of allow the host to use
  any method it wants to fetch the data, such as local storage, for example,
  without being tied to the implementation of `createQueryHandler`.
- Now that `Filter` really has no responsibility for filtering, we rename it to
  `AsyncList` to better suit its new - and more appropriate - role.
- And, finally, this branch also includes a few miscellaneous improvements, such
  as a tidied up and more organized directory structure.

Overall, we end up with highly modular and customizable components that maintain
an appropriate scope of responsibility without forcing too much burden onto the
parent components. This meets the overall goal of reusable components ready to
be used as part of a component library.

## Custom `reflex`-inspired FRP solution

*(this code viewable on the `custom-frp` branch)*

As mentioned before when introducing [RxJS and
`recompose`](#filter-rxjs--recompose), Functional Programming and Functional
Reactive Programming convey massive benefits to front-end apps. However,
`recompose`'s architecture of wrapping all the inputs to a component as a single
Observable object is not necessarily ideal. It forces a specific architecture,
and in doing so makes it difficult to work in any other way than jumping through
those specific hoops. `recompose` also requires pushing event handler functions
to child components to handle child outputs rather than consuming stream outputs
in true FRP fashion. This is consistent with React's one-way data binding model,
but it does incur a level of cognitive overhead, and it doesn't mesh well with
the conceptual model of FRP, where it would make more sense to consume streaming
outputs instead.

The FRP implementation I have been most impressed by in the past is
[reflex](https://github.com/reflex-frp/reflex), an FRP library for Haskell (with
a front-end specific library called
[reflex-dom](https://github.com/reflex-frp/reflex-dom)). Having been impressed
by its power and flexibility in the past, I wanted to see if a similar approach
could be brought to React, in an attempt to address some of the concerns with
`recompose`. However, JS and Haskell are *very* different languages with vastly
different capabilities, even with TypeScript helping to bridge some of the gap.
Furthermore, React's one-way data binding is naturally at odds with the FRP
model of consuming streaming outputs, so integrating the reflex model into React
caused its fair share of friction.  However, with a hefty does of blood, sweat,
and creativity, a feasible proof-of-concept is possible. For now, let's call
that proof-of-concept `Reactive` (a portmanteau of "React" and "Functional
*Reactive* Programming").

### How it works

Imagine a component that accepts a color prop, and renders a text input whose
background color changes based on that prop. In `Reactive`, that might look like
the following:

```ts
// A function that takes the color Observable and returns an Observable of
// changes to the input value
const example = ({ color$ }): Observable<string> => mdo(a => {
  // Render a `div` with no attributes, and a function that will take a
  // mysterious `b` parameter (more on that below) and use it to create the
  // children of the `div`
  a(el("div", {}, b => {
    // Map the color into the attributes for the input element
    const attributes = color$.pipe(map(color => ({ style: { backgroundColor: color } })));
    // Set up a recursive block where we can refer to streams before they're "created"
    return rec<{ setValue: string }>()(scope => {
      // Use the attributes stream and the setValue stream to create the
      // textInput, even though the setValue stream isn't "created" until after
      // the textInput is created.
      const { change } = b(textInput({ setValue: scope.setValue, attributes }));
      scope.setValue = change;
      // The return value of the `rec` block will be the return value of the
      // `rec function - this allows values to be passed back up to the parent
      // scope to be used outside the `rec` block.
      return change;
    });
  }));
});
```

There's a lot going on there, so let's break it down concept by concept.

### Monadic component builder

Unlike `recompose`, Reactive follows `reflex`'s lead and returns streaming
outputs from components, rather than having the parent pass in event handler
functions. However, this doesn't jive with React's one-way model, so
unfortunately JSX is out of the question. Furthermore, it would be a mess to be
constantly having to extract out the outputs *and* the elements out of a
component's return value and then pass those elements back up to the parent to
be part of its children. Fortunately Functional Programming already has a great
way to deal with data that should be implicitly passed around without having to
explicitly work with it - monads. Unfortunately JS does not have monads, and is
not well-suited to working with them. Reactive's component-building "monad"
(called `M` for monad, since [naming things is
hard](https://martinfowler.com/bliki/TwoHardThings.html)) does make it possible
for a component function to add its elements to the current render output
seamlessly, allowing the consuming function to only worry about working with the
output, but it does come at the cost of some additional syntax overhead compared
to the Haskell version.

`mdo` is analogous to `do` in Haskell. However, unlike in Haskell, there's no
way for the functions run within the `mdo` block can't be automatically executed
within the monadic context, so to do so the "block" (ie. the function passed to
`mdo`) is passed a function that can run actions within the monadic context
(which for argument's sake I'll call the "binding" function, though FP purists
may object!). For example:

```ts
mdo(a => {
  // The binding function can be named anything, but to for better clarity when
  // working with nexted monadic scopes, using `a`, `b`, etc. can be helpful
  a(el("div", {}, text("This will be added to the monad")));
  el("div", {}, text("This will not"));
});
```

### Streaming outputs

The binding function unpacks and returns the outputs of a monadic value. For
example:

```ts
textInput: M<{ change: Observable<string>, hasFocus: Observable<boolean>, ...  }>

mdo(a => {
  const textInputOutputs = a(textInput(...));
  return textInputOutputs; // Sets the outputs of this monadic value, just like in Haskell
});
```

### Recursive components

Handling outputs by returning streams has one major problem: it can create
recursive dependencies between components. This is seen in the example above.
`textInput` is a controlled input, so unless `setValue` is provided to the
input, user input won't have any effect on it as there is nothing updating the
input value.

Generally speaking we'll want to update the input based on some kind of
filtering or mapping of the changes the user makes. In the example, we just want
to let any input from the user go through, so we need to feed the `change`
output stream back into the `setValue` input. However, `change` obviously
doesn't exist until after creating the `textInput`, which requires `setValue`,
which requires `change`, which requires `setValue`, etc. In other words, we've
formed a cyclic dependency.

In Haskell this can be easily solved using recursive `do` notation.
Unfortunately this is just not feasible to reproduce using JS/TS (believe me, I
tried). Recursive `do` relies on `MonadFix`, which itself relies on `fix`.
Explaining fixed point functions is way beyond my paygrade, but it is possible
to write `fix` in JavaScript: `const fix = f => f(() => fix(f))`. In JS, we have
to wrap the inner `fix` invocation in a zero-arity function because `fix` relies
on laziness, and thus we must simulate laziness here.

Unfortunately, although this makes emulating `fix` *possible*, it doesn't make
it *feasible*. Since JS is non-lazy, in order to preserve the laziness
introduced in `fix`, we also have to make sure that every reference to that
value is done lazily. This leads to having to wrapping values inside of
zero-arity functions all the way down the call stack. Which is obviously
untenable, since any function using that value - even library functions - will
need to know that it should be accessed via function invocation instead of the
usual direct value access.

Although it is ultimately impossible to reasonably handle recursive dependencies
in a direct imitation of Haskell, it *is* still possible to allow one type of of
value to be referenced recursively: Observables. This is seen in `recompose`,
actually, in `createEventHandler`. Due to the fact that streams fundamentally
define values that change over time (or a stream of values emitted over time,
depending on implementation details), as long as the stream has been created
prior to the recursive reference, the output of the stream and inputs to the
stream can be set up and references in any order.

However, `createEventHandler` from `recompose` still requires passing handler
functions around, and is at odds with the FRP architectural model. Therefore,
Reactive's `rec` provides a way for recursion to be handled via streams alone,
without any handler functions. It does this by setting up a `scope` object that
gets its type information from the generic type parameter given to `rec`. The
`scope` is actually a Proxy to an underlying object that creates streams of the
given type whenever they are referenced (whether by `get` or by `set`). When
that stream is assigned to (ie. `scope.foo = somethingThatMakesAStream()`) the
`scope` Proxy pipes the given stream's output into the referenced stream.

In summary, `rec<{ name: string }>()(scope => { scope.string = foo(scope.string)
})` allows recursive dependencies to be resolved by setting up streams on the
`scope` object that can be either `set` or `get` in any order.

### Converting back into React-land

There are two functions provided for getting Reactive components into a state
usable by React: `renderM` and `toComponent`.

`renderM` simply extracts both the built-up React node and output value from the
monadic value. From there, the output value can be used at will, and the
extracted node can be thrown into JSX at any point (eg.
`<div>{extractedNode}</div>`).

`toComponent` converts the monadic value into a React SFC. It takes a function
that can map from a props stream, just like `recompose` (ie. a stream of `props`
objects), and return a monadic value. It then returns the resulting SFC and
value extracted from the returned monad. For example:

```ts
const { component: Foo } = toComponent(props$ =>
  el("h1", {}, dynText(props$.pipe(pluck("name"))))
);
ReactDOM.render(<div><Foo name="Bar" /></div>, document.getElementById("root"));
```

### Custom FRP summary

Although it's still just a rough proof-of-concept, it is a great example of
React's flexibility, and what can be achieved with a judicial application of
elbow grease, determination, and creativity. Given a polishing - such as through
a custom syntax transformer, like with JSX - Reactive could be a very powerful
tool for bringing the expressiveness and power of FRP to front end JS
applications.

# Conclusion

Ultimately there are no silver bullets, no one "right way" to do things. At the
end of the day, the real world use case, user experience, and value created all
trump any theoretical notion of correctness. Many paths can lead to a single
destination, and nothing is constant except change, so I find flexibility and
continual learning are the most valuable tools in my toolbox.

This has been an in-depth view of my process of evaluating just a few of the
possible approaches, in an isolated context with a constrained understanding of
the problems to be solved. It may be just a small slice, but it is
representative of the detail-oriented problem-solving I bring to projects of any
size. And when combined with my relentless pragmatism and business value focus,
that leads to my specialty: *getting **the right** things done well*.
