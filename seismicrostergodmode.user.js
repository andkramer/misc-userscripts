// ==UserScript==
// @name         Seismic Roster Godmode
// @version      0.3.0
// @license      GPL-3.0
// @namespace    https://github.com/andkramer
// @run-at       document-idle
// @description  TODO
// @author       Andre Kramer (and.kramer@live.de)
// @match        https://seismicgaming.eu/divisions/*/roster
// @grant        GM.setValue
// @grant        GM.getValue
// @updateURL    https://raw.githubusercontent.com/andkramer/misc-userscripts/master/seismicrostergodmode.meta.js
// @downloadURL  https://raw.githubusercontent.com/andkramer/misc-userscripts/master/seismicrostergodmode.user.js
// ==/UserScript==

var hideActiveBtn = $("<span class=\"btn btn-s btn-default-alt btn-block\">Only Inactive</span>");
var showActiveBtn = $("<span class=\"btn btn-s btn-default-alt btn-block\">All Members</span>");
var godModePanel = $("<div class=\"gm-panel\"></div>");
var headlineRow = $("<div class=\"gm-panel-row row\"><div class=\"gm-divname col-sm-4\"></div></div>")
var utilityRow = $("<div class=\"gm-panel-row row\"><div class=\"gm-hide-active col-sm-2\"></div></div>");

var euIcon64 = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxwYXRoIHN0eWxlPSJmaWxsOiM0MTQ3OUI7IiBkPSJNNDczLjY1NSw4OC4yNzVIMzguMzQ1QzE3LjE2Nyw4OC4yNzUsMCwxMDUuNDQyLDAsMTI2LjYyVjM4NS4zOA0KCWMwLDIxLjE3NywxNy4xNjcsMzguMzQ1LDM4LjM0NSwzOC4zNDVoNDM1LjMxYzIxLjE3NywwLDM4LjM0NS0xNy4xNjcsMzguMzQ1LTM4LjM0NVYxMjYuNjINCglDNTEyLDEwNS40NDIsNDk0LjgzMyw4OC4yNzUsNDczLjY1NSw4OC4yNzV6Ii8+DQo8Zz4NCgk8cGF0aCBzdHlsZT0iZmlsbDojRkZFMTVBOyIgZD0iTTI1OS41OSwxMjYuNjg0bDMuNTQsMTAuNjEzbDExLjE4NywwLjA4N2MxLjQ0OSwwLjAxMSwyLjA0OSwxLjg1OSwwLjg4NCwyLjcybC05LDYuNjQ2DQoJCWwzLjM3NCwxMC42NjZjMC40MzcsMS4zOC0xLjEzNSwyLjUyNC0yLjMxNCwxLjY4MWwtOS4xMDEtNi41MDZsLTkuMTAxLDYuNTA2Yy0xLjE3OCwwLjg0Mi0yLjc1MS0wLjMtMi4zMTQtMS42ODFsMy4zNzQtMTAuNjY2DQoJCWwtOS02LjY0NmMtMS4xNjUtMC44NjEtMC41NjUtMi43MDksMC44ODQtMi43MmwxMS4xODctMC4wODdsMy41NC0xMC42MTNDMjU3LjE4NywxMjUuMzEsMjU5LjEzMiwxMjUuMzEsMjU5LjU5LDEyNi42ODR6Ii8+DQoJPHBhdGggc3R5bGU9ImZpbGw6I0ZGRTE1QTsiIGQ9Ik0yNTkuNTksMzU0LjU0N2wzLjU0LDEwLjYxM2wxMS4xODcsMC4wODdjMS40NDksMC4wMTEsMi4wNDksMS44NTksMC44ODQsMi43MmwtOSw2LjY0Ng0KCQlsMy4zNzQsMTAuNjY2YzAuNDM3LDEuMzgtMS4xMzUsMi41MjQtMi4zMTQsMS42ODFsLTkuMTAxLTYuNTA2bC05LjEwMSw2LjUwNmMtMS4xNzgsMC44NDItMi43NTEtMC4zLTIuMzE0LTEuNjgxbDMuMzc0LTEwLjY2Ng0KCQlsLTktNi42NDZjLTEuMTY1LTAuODYxLTAuNTY1LTIuNzA5LDAuODg0LTIuNzJsMTEuMTg3LTAuMDg3bDMuNTQtMTAuNjEzQzI1Ny4xODcsMzUzLjE3MiwyNTkuMTMyLDM1My4xNzIsMjU5LjU5LDM1NC41NDd6Ii8+DQoJPHBhdGggc3R5bGU9ImZpbGw6I0ZGRTE1QTsiIGQ9Ik0zNzMuNTIxLDI0MC42MTVsMy41NCwxMC42MTNsMTEuMTg3LDAuMDg3YzEuNDQ5LDAuMDExLDIuMDQ5LDEuODU5LDAuODg0LDIuNzJsLTksNi42NDYNCgkJbDMuMzc0LDEwLjY2NmMwLjQzNywxLjM4LTEuMTM1LDIuNTI0LTIuMzE0LDEuNjgxbC05LjEwMS02LjUwNmwtOS4xMDEsNi41MDZjLTEuMTc4LDAuODQyLTIuNzUxLTAuMy0yLjMxNC0xLjY4MWwzLjM3NC0xMC42NjYNCgkJbC05LTYuNjQ2Yy0xLjE2NS0wLjg2MS0wLjU2NS0yLjcwOSwwLjg4NC0yLjcybDExLjE4Ny0wLjA4N2wzLjU0LTEwLjYxM0MzNzEuMTE4LDIzOS4yNDIsMzczLjA2MywyMzkuMjQyLDM3My41MjEsMjQwLjYxNXoiLz4NCgk8cGF0aCBzdHlsZT0iZmlsbDojRkZFMTVBOyIgZD0iTTE0NS42NTgsMjQwLjYxNWwzLjU0LDEwLjYxM2wxMS4xODcsMC4wODdjMS40NDksMC4wMTEsMi4wNDksMS44NTksMC44ODQsMi43MmwtOSw2LjY0Ng0KCQlsMy4zNzQsMTAuNjY2YzAuNDM3LDEuMzgtMS4xMzUsMi41MjQtMi4zMTQsMS42ODFsLTkuMTAxLTYuNTA2bC05LjEwMSw2LjUwNmMtMS4xNzgsMC44NDItMi43NTEtMC4zLTIuMzE0LTEuNjgxbDMuMzc0LTEwLjY2Ng0KCQlsLTktNi42NDZjLTEuMTY1LTAuODYxLTAuNTY1LTIuNzA5LDAuODg0LTIuNzJsMTEuMTg3LTAuMDg3bDMuNTQtMTAuNjEzQzE0My4yNTYsMjM5LjI0MiwxNDUuMjAxLDIzOS4yNDIsMTQ1LjY1OCwyNDAuNjE1eiIvPg0KCTxwYXRoIHN0eWxlPSJmaWxsOiNGRkUxNUE7IiBkPSJNMTYyLjc2MiwxODEuMTE5bDMuNTQsMTAuNjEzbDExLjE4NywwLjA4N2MxLjQ0OSwwLjAxMSwyLjA0OSwxLjg1OSwwLjg4NCwyLjcybC05LDYuNjQ2DQoJCWwzLjM3NCwxMC42NjZjMC40MzcsMS4zOC0xLjEzNSwyLjUyNC0yLjMxNCwxLjY4MWwtOS4xMDEtNi41MDZsLTkuMTAxLDYuNTA2Yy0xLjE3OCwwLjg0Mi0yLjc1MS0wLjMtMi4zMTQtMS42ODFsMy4zNzQtMTAuNjY2DQoJCWwtOS02LjY0NmMtMS4xNjUtMC44NjEtMC41NjUtMi43MDksMC44ODQtMi43MmwxMS4xODctMC4wODdsMy41NC0xMC42MTNDMTYwLjM2LDE3OS43NDUsMTYyLjMwMywxNzkuNzQ1LDE2Mi43NjIsMTgxLjExOXoiLz4NCgk8cGF0aCBzdHlsZT0iZmlsbDojRkZFMTVBOyIgZD0iTTM2MC4wOTYsMjk1LjA1bDMuNTQsMTAuNjEzbDExLjE4NywwLjA4N2MxLjQ0OSwwLjAxMSwyLjA0OSwxLjg1OSwwLjg4NCwyLjcybC05LDYuNjQ2DQoJCWwzLjM3NCwxMC42NjZjMC40MzcsMS4zODItMS4xMzUsMi41MjQtMi4zMTQsMS42ODFsLTkuMTAxLTYuNTA2bC05LjEwMSw2LjUwNmMtMS4xNzgsMC44NDItMi43NTEtMC4zLTIuMzE0LTEuNjgxbDMuMzc0LTEwLjY2Ng0KCQlsLTktNi42NDZjLTEuMTY1LTAuODYxLTAuNTY1LTIuNzA5LDAuODg0LTIuNzJsMTEuMTg3LTAuMDg3bDMuNTQtMTAuNjEzQzM1Ny42OTQsMjkzLjY3NywzNTkuNjM4LDI5My42NzcsMzYwLjA5NiwyOTUuMDV6Ii8+DQoJPHBhdGggc3R5bGU9ImZpbGw6I0ZGRTE1QTsiIGQ9Ik0zMTguMzk1LDEzOS40MTdsMy41NCwxMC42MTNsMTEuMTg3LDAuMDg3YzEuNDQ5LDAuMDExLDIuMDQ5LDEuODU5LDAuODg0LDIuNzJsLTksNi42NDYNCgkJbDMuMzc0LDEwLjY2NmMwLjQzNywxLjM4LTEuMTM1LDIuNTI0LTIuMzE0LDEuNjgxbC05LjEwMS02LjUwNmwtOS4xMDIsNi41MDZjLTEuMTc4LDAuODQyLTIuNzUxLTAuMy0yLjMxNC0xLjY4MWwzLjM3NC0xMC42NjYNCgkJbC05LTYuNjQ2Yy0xLjE2NS0wLjg2MS0wLjU2NS0yLjcwOSwwLjg4NC0yLjcybDExLjE4Ny0wLjA4N2wzLjU0LTEwLjYxM0MzMTUuOTkyLDEzOC4wNDQsMzE3LjkzNSwxMzguMDQ0LDMxOC4zOTUsMTM5LjQxN3oiLz4NCgk8cGF0aCBzdHlsZT0iZmlsbDojRkZFMTVBOyIgZD0iTTIwNC40NjMsMzM2Ljc1M2wzLjU0LDEwLjYxM2wxMS4xODcsMC4wODdjMS40NDksMC4wMTEsMi4wNDksMS44NTksMC44ODQsMi43MmwtOSw2LjY0Ng0KCQlsMy4zNzQsMTAuNjY2YzAuNDM3LDEuMzgtMS4xMzUsMi41MjQtMi4zMTQsMS42ODFsLTkuMTAxLTYuNTA2bC05LjEwMSw2LjUwNmMtMS4xNzgsMC44NDItMi43NTEtMC4zLTIuMzE0LTEuNjgxbDMuMzc0LTEwLjY2Ng0KCQlsLTktNi42NDZjLTEuMTY1LTAuODYxLTAuNTY1LTIuNzA5LDAuODg0LTIuNzJsMTEuMTg3LTAuMDg2bDMuNTQtMTAuNjEzQzIwMi4wNjEsMzM1LjM3OCwyMDQuMDA2LDMzNS4zNzgsMjA0LjQ2MywzMzYuNzUzeiIvPg0KCTxwYXRoIHN0eWxlPSJmaWxsOiNGRkUxNUE7IiBkPSJNMzU3LjIzNiwxODEuMTE5bC0zLjU0LDEwLjYxM2wtMTEuMTg3LDAuMDg3Yy0xLjQ0OSwwLjAxMS0yLjA0OSwxLjg1OS0wLjg4NCwyLjcybDksNi42NDYNCgkJbC0zLjM3NCwxMC42NjZjLTAuNDM3LDEuMzgsMS4xMzUsMi41MjQsMi4zMTQsMS42ODFsOS4xMDEtNi41MDZsOS4xMDEsNi41MDZjMS4xNzgsMC44NDIsMi43NTEtMC4zLDIuMzE0LTEuNjgxbC0zLjM3NC0xMC42NjYNCgkJbDktNi42NDZjMS4xNjUtMC44NjEsMC41NjUtMi43MDktMC44ODQtMi43MmwtMTEuMTg3LTAuMDg3bC0zLjU0LTEwLjYxM0MzNTkuNjM4LDE3OS43NDUsMzU3LjY5NCwxNzkuNzQ1LDM1Ny4yMzYsMTgxLjExOXoiLz4NCgk8cGF0aCBzdHlsZT0iZmlsbDojRkZFMTVBOyIgZD0iTTE1OS45MDIsMjk1LjA1bC0zLjU0LDEwLjYxM2wtMTEuMTg3LDAuMDg3Yy0xLjQ0OSwwLjAxMS0yLjA0OSwxLjg1OS0wLjg4NCwyLjcybDksNi42NDYNCgkJbC0zLjM3NCwxMC42NjZjLTAuNDM3LDEuMzgyLDEuMTM1LDIuNTI0LDIuMzE0LDEuNjgxbDkuMTAxLTYuNTA2bDkuMTAxLDYuNTA2YzEuMTc4LDAuODQyLDIuNzUxLTAuMywyLjMxNC0xLjY4MWwtMy4zNzQtMTAuNjY2DQoJCWw5LTYuNjQ2YzEuMTY1LTAuODYxLDAuNTY1LTIuNzA5LTAuODg0LTIuNzJsLTExLjE4Ny0wLjA4N2wtMy41NC0xMC42MTNDMTYyLjMwMywyOTMuNjc3LDE2MC4zNiwyOTMuNjc3LDE1OS45MDIsMjk1LjA1eiIvPg0KCTxwYXRoIHN0eWxlPSJmaWxsOiNGRkUxNUE7IiBkPSJNMjAxLjYwMywxMzkuNDE3bC0zLjU0LDEwLjYxM2wtMTEuMTg3LDAuMDg3Yy0xLjQ0OSwwLjAxMS0yLjA0OSwxLjg1OS0wLjg4NCwyLjcybDksNi42NDYNCgkJbC0zLjM3NCwxMC42NjZjLTAuNDM3LDEuMzgsMS4xMzUsMi41MjQsMi4zMTQsMS42ODFsOS4xMDEtNi41MDZsOS4xMDEsNi41MDZjMS4xNzgsMC44NDIsMi43NTEtMC4zLDIuMzE0LTEuNjgxbC0zLjM3NC0xMC42NjYNCgkJbDktNi42NDZjMS4xNjUtMC44NjEsMC41NjUtMi43MDktMC44ODQtMi43MmwtMTEuMTg3LTAuMDg3bC0zLjU0LTEwLjYxM0MyMDQuMDA0LDEzOC4wNDQsMjAyLjA2MSwxMzguMDQ0LDIwMS42MDMsMTM5LjQxN3oiLz4NCgk8cGF0aCBzdHlsZT0iZmlsbDojRkZFMTVBOyIgZD0iTTMxNS41MzQsMzM2Ljc1M2wtMy41NCwxMC42MTNsLTExLjE4NywwLjA4N2MtMS40NDksMC4wMTEtMi4wNDksMS44NTktMC44ODQsMi43Mmw5LDYuNjQ2DQoJCWwtMy4zNzQsMTAuNjY2Yy0wLjQzNywxLjM4LDEuMTM1LDIuNTI0LDIuMzE0LDEuNjgxbDkuMTAxLTYuNTA2bDkuMTAxLDYuNTA2YzEuMTc4LDAuODQyLDIuNzUxLTAuMywyLjMxNC0xLjY4MWwtMy4zNzQtMTAuNjY2DQoJCWw5LTYuNjQ2YzEuMTY1LTAuODYxLDAuNTY1LTIuNzA5LTAuODg0LTIuNzJsLTExLjE4Ny0wLjA4NmwtMy41NC0xMC42MTNDMzE3LjkzNSwzMzUuMzc4LDMxNS45OTIsMzM1LjM3OCwzMTUuNTM0LDMzNi43NTN6Ii8+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8L3N2Zz4NCg==";
var naIcon64 = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTEyIDUxMjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHBhdGggc3R5bGU9ImZpbGw6I0VFRUVFRTsiIGQ9Ik0xLjgxMSwzOTcuNTk0YzAuMzcsMS40MzYsMC44NCwyLjgzLDEuMzA5LDQuMjFjMS4yNjYsMy42ODQsMi44MDIsNy4yNDEsNC43MzYsMTAuNTY5DQoJYzAuMDE1LDAuMDI4LDAuMDE1LDAuMDcyLDAuMDMsMC4wNzJoMC4wMDdjOS44NTYsMTYuOTM5LDI3Ljk4OSwyOC40NDQsNDguOTk2LDI4LjQ0NGgzOTguMjIyYzIxLjAwNiwwLDM5LjE0LTExLjUwNiw0OC45OTYtMjguNDQ0DQoJaDAuMDA3YzAuMDE0LDAsMC4wMTQtMC4wNDQsMC4wMjgtMC4wNTljMS45Mi0zLjMxNCwzLjQ1Ni02Ljg3LDQuNzIyLTEwLjU0YzAuNDg0LTEuNDA4LDAuOTUzLTIuODE2LDEuMzIzLTQuMjY3DQoJYzAuMzQxLTEuMjk0LDAuNTk3LTIuNjAyLDAuODM5LTMuOTFjMC41NTYtMy4wNjgsMC45NTUtNi4xNzMsMC45NzUtOS40MzFWMzg0di0yOC40NDR2LTI4LjQ0NHYtMjguNDQ0di0yOC40NDR2LTI4LjQ0NHYtMjguNDQ0DQoJdi0yOC40NDR2LTI4LjQ0NFYxMjhjMC0zLjMxNC0wLjM5OC02LjUyOC0wLjk4MS05LjY3MWMtMC4yMjgtMS4zMDgtMC40OTgtMi42MTctMC44MjUtMy44OTdjLTAuMzg0LTEuNDY1LTAuODUzLTIuODg3LTEuMzM3LTQuMjk1DQoJYy0xLjI2Ni0zLjY2OS0yLjc4OC03LjIxMS00LjcyMi0xMC41MjRjMC0wLjAxNC0wLjAxNC0wLjA0My0wLjAyOC0wLjA1N2gwLjAwMmMtOS44NTYtMTYuOTM5LTI3Ljk4OS0yOC40NDQtNDguOTk2LTI4LjQ0NEgyNTYNCgl2MjguNDQ0VjEyOHYyOC40NDR2MjguNDQ0djI4LjQ0NHYyOC40NDR2MjguNDQ0SDB2MjguNDQ0djI4LjQ0NHYyOC40NDRWMzg0YzAsMy4zMTMsMC40MDIsNi41MTIsMC45Nyw5LjY1NA0KCUMxLjIxMiwzOTQuOTc3LDEuNDg0LDM5Ni4zLDEuODExLDM5Ny41OTR6Ii8+DQo8Zz4NCgk8cGF0aCBzdHlsZT0iZmlsbDojQjIyMzM0OyIgZD0iTTUwNC4xMDgsOTkuNTU2Yy05Ljg1Ni0xNi45MzktMjcuOTg5LTI4LjQ0NC00OC45OTYtMjguNDQ0SDI1NnYyOC40NDRoMjQ4LjEwN0g1MDQuMTA4eiIvPg0KCTxwb2x5Z29uIHN0eWxlPSJmaWxsOiNCMjIzMzQ7IiBwb2ludHM9IjAsMzg0IDUxMiwzODQgNTEyLDM1NS41NTYgMCwzNTUuNTU2IDAsMzg0IAkiLz4NCgk8cmVjdCB4PSIyNTYiIHk9IjI0MS43NzgiIHN0eWxlPSJmaWxsOiNCMjIzMzQ7IiB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI4LjQ0NCIvPg0KCTxyZWN0IHg9IjI1NiIgeT0iMTg0Ljg4OSIgc3R5bGU9ImZpbGw6I0IyMjMzNDsiIHdpZHRoPSIyNTYiIGhlaWdodD0iMjguNDQ0Ii8+DQoJPHJlY3QgeT0iMjk4LjY2NyIgc3R5bGU9ImZpbGw6I0IyMjMzNDsiIHdpZHRoPSI1MTIiIGhlaWdodD0iMjguNDQ0Ii8+DQoJPHBhdGggc3R5bGU9ImZpbGw6I0IyMjMzNDsiIGQ9Ik00NTUuMTExLDQ0MC44ODljMjEuMDA2LDAsMzkuMTQtMTEuNTA2LDQ4Ljk5Ni0yOC40NDRINy44OTMNCgkJYzkuODU2LDE2LjkzOSwyNy45ODksMjguNDQ0LDQ4Ljk5NiwyOC40NDRINDU1LjExMXoiLz4NCgk8cmVjdCB4PSIyNTYiIHk9IjEyOCIgc3R5bGU9ImZpbGw6I0IyMjMzNDsiIHdpZHRoPSIyNTYiIGhlaWdodD0iMjguNDQ0Ii8+DQo8L2c+DQo8Zz4NCgk8cGF0aCBzdHlsZT0iZmlsbDojRUVFRUVFOyIgZD0iTTAsMTI4YzAtMy4zMTQsMC40MjctNi41LDAuOTY3LTkuNjU3QzAuMzk4LDEyMS40ODYsMCwxMjQuNjg2LDAsMTI4Ii8+DQoJPHBhdGggc3R5bGU9ImZpbGw6I0VFRUVFRTsiIGQ9Ik03Ljg4OSw5OS41NTZjLTAuMDE0LDAuMDI4LTAuMDI4LDAuMDQzLTAuMDI4LDAuMDcxQzcuODc1LDk5LjU5OCw3Ljg3NSw5OS41ODQsNy44ODksOTkuNTU2eiIvPg0KCTxwYXRoIHN0eWxlPSJmaWxsOiNFRUVFRUU7IiBkPSJNMS44MTYsMTE0LjQwOWMwLjM1Ni0xLjQ1MSwwLjg1My0yLjgzLDEuMzA4LTQuMjI0QzIuNjU1LDExMS41NzksMi4xODYsMTEyLjk3MywxLjgxNiwxMTQuNDA5Ii8+DQo8L2c+DQo8cGF0aCBzdHlsZT0iZmlsbDojM0MzQjZFOyIgZD0iTTI1Niw3MS4xMTFINTYuODg5QzI1LjQ3Miw3MS4xMTEsMCw5Ni41ODMsMCwxMjh2MTQyLjIyMmgyNTZWNzEuMTExeiIvPg0KPGc+DQoJPHBhdGggc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGQ9Ik0yOC40NjUsMTA5Ljg3Mmw4Ljc4OSw2LjM4NmwtMy4zNTYsMTAuMzI1bDguNzc1LTYuMzg2bDguNzg5LDYuMzg2bC0zLjM3MS0xMC4zMjVsOC44MDQtNi4zODYNCgkJSDQ2LjAyOWwtMy4zNTYtMTAuMzI1bC0zLjM0MiwxMC4zMjVIMjguNDY1eiIvPg0KCTxwYXRoIHN0eWxlPSJmaWxsOiNGRkZGRkY7IiBkPSJNNTYuOTA5LDEzOC4zMTZsOC43ODksNi4zODZsLTMuMzcxLDEwLjMyNWw4Ljc4OS02LjM4Nmw4Ljc4OSw2LjM4NmwtMy4zNzEtMTAuMzI1bDguODA0LTYuMzg2DQoJCUg3NC40NzNsLTMuMzU2LTEwLjMyNWwtMy4zNDIsMTAuMzI1SDU2LjkwOXoiLz4NCgk8cGF0aCBzdHlsZT0iZmlsbDojRkZGRkZGOyIgZD0iTTExMy43OTgsMTM4LjMxNmw4Ljc4OSw2LjM4NmwtMy4zNzEsMTAuMzI1bDguNzg5LTYuMzg2bDguNzg5LDYuMzg2bC0zLjM3MS0xMC4zMjVsOC44MDQtNi4zODYNCgkJaC0xMC44NjZsLTMuMzU2LTEwLjMyNWwtMy4zNDIsMTAuMzI1SDExMy43OTh6Ii8+DQoJPHBhdGggc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGQ9Ik0xNzAuNjg3LDEzOC4zMTZsOC43ODksNi4zODZsLTMuMzcxLDEwLjMyNWw4Ljc4OS02LjM4Nmw4Ljc4OSw2LjM4NmwtMy4zNzEtMTAuMzI1bDguODA0LTYuMzg2DQoJCWgtMTAuODY2bC0zLjM1Ni0xMC4zMjVsLTMuMzQyLDEwLjMyNUgxNzAuNjg3eiIvPg0KCTxwYXRoIHN0eWxlPSJmaWxsOiNGRkZGRkY7IiBkPSJNNTYuOTA5LDE5NS4yMDhsOC43ODksNi4zODZsLTMuMzcxLDEwLjMyNWw4Ljc4OS02LjM4Nmw4Ljc4OSw2LjM4NmwtMy4zNzEtMTAuMzI1bDguODA0LTYuMzg2DQoJCUg3NC40NzNsLTMuMzU2LTEwLjMyNWwtMy4zNDIsMTAuMzI1SDU2LjkwOXoiLz4NCgk8cGF0aCBzdHlsZT0iZmlsbDojRkZGRkZGOyIgZD0iTTExMy43OTgsMTk1LjIwOGw4Ljc4OSw2LjM4NmwtMy4zNzEsMTAuMzI1bDguNzg5LTYuMzg2bDguNzg5LDYuMzg2bC0zLjM3MS0xMC4zMjVsOC44MDQtNi4zODYNCgkJaC0xMC44NjZsLTMuMzU2LTEwLjMyNWwtMy4zNDIsMTAuMzI1SDExMy43OTh6Ii8+DQoJPHBhdGggc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGQ9Ik0xNzAuNjg3LDE5NS4yMDhsOC43ODksNi4zODZsLTMuMzcxLDEwLjMyNWw4Ljc4OS02LjM4Nmw4Ljc4OSw2LjM4NmwtMy4zNzEtMTAuMzI1bDguODA0LTYuMzg2DQoJCWgtMTAuODY2bC0zLjM1Ni0xMC4zMjVsLTMuMzQyLDEwLjMyNUgxNzAuNjg3eiIvPg0KCTxwYXRoIHN0eWxlPSJmaWxsOiNGRkZGRkY7IiBkPSJNODUuMzUzLDEwOS44NzJsOC43ODksNi4zODZsLTMuMzcxLDEwLjMyNWw4Ljc4OS02LjM4Nmw4Ljc4OSw2LjM4NmwtMy4zNzEtMTAuMzI1bDguODA0LTYuMzg2DQoJCWgtMTAuODY2bC0zLjM1Ni0xMC4zMjVsLTMuMzQyLDEwLjMyNUg4NS4zNTN6Ii8+DQoJPHBhdGggc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGQ9Ik0xNDIuMjQyLDEwOS44NzJsOC43ODksNi4zODZsLTMuMzcxLDEwLjMyNWw4Ljc4OS02LjM4Nmw4Ljc4OSw2LjM4NmwtMy4zNzEtMTAuMzI1bDguODA0LTYuMzg2DQoJCWgtMTAuODY2bC0zLjM1Ni0xMC4zMjVsLTMuMzQyLDEwLjMyNUgxNDIuMjQyeiIvPg0KCTxwYXRoIHN0eWxlPSJmaWxsOiNGRkZGRkY7IiBkPSJNMTk5LjEzMSwxMDkuODcybDguNzg5LDYuMzg2bC0zLjM3MSwxMC4zMjVsOC43ODktNi4zODZsOC43ODksNi4zODZsLTMuMzcxLTEwLjMyNWw4LjgwNC02LjM4Ng0KCQloLTEwLjg2NmwtMy4zNTYtMTAuMzI1bC0zLjM0MiwxMC4zMjVIMTk5LjEzMXoiLz4NCgk8cGF0aCBzdHlsZT0iZmlsbDojRkZGRkZGOyIgZD0iTTI4LjQ2NSwxNjYuNzY0bDguNzg5LDYuMzg2bC0zLjM1NiwxMC4zMjVsOC43NzUtNi4zODZsOC43ODksNi4zODZsLTMuMzcxLTEwLjMyNWw4LjgwNC02LjM4Ng0KCQlINDYuMDI5bC0zLjM1Ni0xMC4zMjVsLTMuMzQyLDEwLjMyNUgyOC40NjV6Ii8+DQoJPHBhdGggc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGQ9Ik05MC43NzgsMTgzLjQ3M2w4Ljc4OS02LjM4Nmw4Ljc3NSw2LjM4NmwtMy4zNTYtMTAuMzI1bDguNzg5LTYuMzg2aC0xMC44NTJsLTMuMzU2LTEwLjMxMQ0KCQlsLTMuMzU2LDEwLjMxMUg4NS4zNTlsOC43NzUsNi4zODZMOTAuNzc4LDE4My40NzN6Ii8+DQoJPHBhdGggc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGQ9Ik0xNDIuMjQyLDE2Ni43NjRsOC43ODksNi4zODZsLTMuMzcxLDEwLjMyNWw4Ljc4OS02LjM4Nmw4Ljc4OSw2LjM4NmwtMy4zNzEtMTAuMzI1bDguODA0LTYuMzg2DQoJCWgtMTAuODY2bC0zLjM1Ni0xMC4zMjVsLTMuMzQyLDEwLjMyNUgxNDIuMjQyeiIvPg0KCTxwYXRoIHN0eWxlPSJmaWxsOiNGRkZGRkY7IiBkPSJNMTk5LjEzMSwxNjYuNzY0bDguNzg5LDYuMzg2bC0zLjM3MSwxMC4zMjVsOC43ODktNi4zODZsOC43ODksNi4zODZsLTMuMzcxLTEwLjMyNWw4LjgwNC02LjM4Ng0KCQloLTEwLjg2NmwtMy4zNTYtMTAuMzI1bC0zLjM0MiwxMC4zMjVIMTk5LjEzMXoiLz4NCgk8cGF0aCBzdHlsZT0iZmlsbDojRkZGRkZGOyIgZD0iTTI4LjQ2NSwyMjMuNjUzbDguNzg5LDYuMzg2bC0zLjM1NiwxMC4zMjVsOC43NzUtNi4zODZsOC43ODksNi4zODZsLTMuMzcxLTEwLjMyNWw4LjgwNC02LjM4Ng0KCQlINDYuMDI5bC0zLjM1Ni0xMC4zMjVsLTMuMzQyLDEwLjMyNUwyOC40NjUsMjIzLjY1M0wyOC40NjUsMjIzLjY1M3oiLz4NCgk8cGF0aCBzdHlsZT0iZmlsbDojRkZGRkZGOyIgZD0iTTkwLjc3OCwyNDAuMzYxbDguNzg5LTYuMzg2bDguNzc1LDYuMzg2bC0zLjM1Ni0xMC4zMjVsOC43ODktNi4zODZoLTEwLjg1MmwtMy4zNTYtMTAuMzExDQoJCWwtMy4zNTYsMTAuMzExSDg1LjM1OWw4Ljc3NSw2LjM4Nkw5MC43NzgsMjQwLjM2MXoiLz4NCgk8cGF0aCBzdHlsZT0iZmlsbDojRkZGRkZGOyIgZD0iTTE0Mi4yNDIsMjIzLjY1M2w4Ljc4OSw2LjM4NmwtMy4zNzEsMTAuMzI1bDguNzg5LTYuMzg2bDguNzg5LDYuMzg2bC0zLjM3MS0xMC4zMjVsOC44MDQtNi4zODYNCgkJaC0xMC44NjZsLTMuMzU2LTEwLjMyNWwtMy4zNDIsMTAuMzI1TDE0Mi4yNDIsMjIzLjY1M0wxNDIuMjQyLDIyMy42NTN6Ii8+DQoJPHBhdGggc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGQ9Ik0xOTkuMTMxLDIyMy42NTNsOC43ODksNi4zODZsLTMuMzcxLDEwLjMyNWw4Ljc4OS02LjM4Nmw4Ljc4OSw2LjM4NmwtMy4zNzEtMTAuMzI1bDguODA0LTYuMzg2DQoJCWgtMTAuODY2bC0zLjM1Ni0xMC4zMjVsLTMuMzQyLDEwLjMyNUwxOTkuMTMxLDIyMy42NTNMMTk5LjEzMSwyMjMuNjUzeiIvPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPC9zdmc+DQo=";
var ocIcon64 = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxwYXRoIHN0eWxlPSJmaWxsOiM0MTQ3OUI7IiBkPSJNNDczLjY1NSw4OC4yNzVIMzguMzQ1QzE3LjE2Nyw4OC4yNzUsMCwxMDUuNDQyLDAsMTI2LjYyVjM4NS4zOA0KCWMwLDIxLjE3NywxNy4xNjcsMzguMzQ1LDM4LjM0NSwzOC4zNDVoNDM1LjMxYzIxLjE3NywwLDM4LjM0NS0xNy4xNjcsMzguMzQ1LTM4LjM0NVYxMjYuNjINCglDNTEyLDEwNS40NDIsNDk0LjgzMyw4OC4yNzUsNDczLjY1NSw4OC4yNzV6Ii8+DQo8cGF0aCBzdHlsZT0iZmlsbDojRjVGNUY1OyIgZD0iTTguODI4LDI1NS45OTloMTUuMzM0bDgxLjc3LTUzLjU3NHY1My41NzRoNDQuMTM4di01My41NzRsODEuNzY5LDUzLjU3NGgxNS4zMzQNCgljNC44NzUsMCw4LjgyOC0zLjk1Myw4LjgyOC04LjgyOHYtNy4wMDJsLTcwLjE1NS00NS45NjNIMjU2di00NC4xMzhoLTcwLjE1NUwyNTYsMTA0LjEwNXYtNy4wMDJjMC00Ljg3Ni0zLjk1My04LjgyOC04LjgyOC04LjgyOA0KCWgtMTUuMzM0bC04MS43Nyw1My41NzRWODguMjc1SDEwNS45M3Y1My41NzRMMjYuODQ0LDkwLjAzM2MtOS4yMzQsMi45LTE2Ljk1NCw5LjIwMy0yMS43MTEsMTcuNDM0bDY1LjAyMyw0Mi42MDFIMHY0NC4xMzhoNzAuMTU1DQoJTDAsMjQwLjE2OXY3LjAwMkMwLDI1Mi4wNDYsMy45NTEsMjU1Ljk5OSw4LjgyOCwyNTUuOTk5eiIvPg0KPGc+DQoJPHBvbHlnb24gc3R5bGU9ImZpbGw6I0ZGNEI1NTsiIHBvaW50cz0iMjU2LDE1OC44OTYgMTQxLjI0MSwxNTguODk2IDE0MS4yNDEsODguMjc1IDExNC43NTksODguMjc1IDExNC43NTksMTU4Ljg5NiAwLDE1OC44OTYgDQoJCTAsMTg1LjM3OCAxMTQuNzU5LDE4NS4zNzggMTE0Ljc1OSwyNTUuOTk5IDE0MS4yNDEsMjU1Ljk5OSAxNDEuMjQxLDE4NS4zNzggMjU2LDE4NS4zNzggCSIvPg0KCTxwYXRoIHN0eWxlPSJmaWxsOiNGRjRCNTU7IiBkPSJNOC4yMjcsMTAyLjkwMWw3Mi42NjIsNDcuMTY3aDE2LjIxNGwtODIuNDk2LTUzLjU1QzEyLjIzOCw5OC4zODgsMTAuMDk3LDEwMC41MzEsOC4yMjcsMTAyLjkwMXoiLz4NCgk8cGF0aCBzdHlsZT0iZmlsbDojRkY0QjU1OyIgZD0iTTE2Ni4yODMsMTUwLjA2OGw4OC4zNzQtNTcuMzY2Yy0xLjUzNi0yLjU5OS00LjI0Ni00LjQyNy03LjQ4NS00LjQyN2gtMS45MWwtOTUuMTkzLDYxLjc5M0gxNjYuMjgzDQoJCXoiLz4NCgk8cGF0aCBzdHlsZT0iZmlsbDojRkY0QjU1OyIgZD0iTTg5LjQ3NCwxOTQuMjA2TDEuMjY5LDI1MS40NjJjMS41MjEsMi42NjIsNC4yNzMsNC41MzcsNy41NTksNC41MzdoMS42NjVsOTUuMTk2LTYxLjc5M0g4OS40NzR6Ii8+DQoJPHBhdGggc3R5bGU9ImZpbGw6I0ZGNEI1NTsiIGQ9Ik0yNTUuODYsMjQ3Ljg2NWwtODIuNjY2LTUzLjY1OEgxNTYuOThsOTMuODc0LDYwLjkzNQ0KCQlDMjUzLjY2NiwyNTMuODM3LDI1NS41OTUsMjUxLjEwMiwyNTUuODYsMjQ3Ljg2NXoiLz4NCjwvZz4NCjxnPg0KCTxwYXRoIHN0eWxlPSJmaWxsOiNGNUY1RjU7IiBkPSJNMTMwLjY3MSwzMDQuMTNsNi42NjMsMjEuOTk3bDIxLjM1My04LjUwNWMxLjgyMi0wLjcyNiwzLjQ3OCwxLjM1MiwyLjM2NiwyLjk2NmwtMTMuMDQ0LDE4LjkyNA0KCQlsMTkuOTYyLDExLjM5MWMxLjcwMywwLjk3MiwxLjExMiwzLjU2Mi0wLjg0NCwzLjY5OWwtMjIuOTI5LDEuNjAxbDMuNTQxLDIyLjcwOWMwLjMwMiwxLjkzOC0yLjA5MiwzLjA5MS0zLjQxOCwxLjY0Ng0KCQlsLTE1LjU0OC0xNi45MjhsLTE1LjU0OCwxNi45MjhjLTEuMzI2LDEuNDQ0LTMuNzIsMC4yOTEtMy40MTgtMS42NDZsMy41NDEtMjIuNzA5bC0yMi45MjktMS42MDENCgkJYy0xLjk1Ni0wLjEzNy0yLjU0OC0yLjcyNy0wLjg0NC0zLjY5OWwxOS45NjItMTEuMzkxbC0xMy4wNDQtMTguOTI0Yy0xLjExMi0xLjYxNCwwLjU0NC0zLjY5MiwyLjM2Ni0yLjk2NmwyMS4zNTMsOC41MDUNCgkJbDYuNjYzLTIxLjk5N0MxMjcuNDQ2LDMwMi4yNTMsMTMwLjEwMywzMDIuMjUzLDEzMC42NzEsMzA0LjEzeiIvPg0KCTxwYXRoIHN0eWxlPSJmaWxsOiNGNUY1RjU7IiBkPSJNMzkzLjI3OSwxNDcuNzI5bDMuMjU1LDEwLjc0NWwxMC40My00LjE1NGMwLjg4OS0wLjM1NCwxLjY5OSwwLjY2LDEuMTU1LDEuNDQ5bC02LjM3MSw5LjI0NQ0KCQlsOS43NTEsNS41NjVjMC44MzIsMC40NzQsMC41NDMsMS43NC0wLjQxMywxLjgwNmwtMTEuMiwwLjc4MmwxLjcyOSwxMS4wOTNjMC4xNDgsMC45NDctMS4wMjIsMS41MS0xLjY3LDAuODA0bC03LjU5NS04LjI2OQ0KCQlsLTcuNTk1LDguMjY5Yy0wLjY0OCwwLjcwNS0xLjgxNywwLjE0Mi0xLjY3LTAuODA0bDEuNzI5LTExLjA5M2wtMTEuMi0wLjc4MmMtMC45NTYtMC4wNjctMS4yNDUtMS4zMzItMC40MTMtMS44MDZsOS43NTEtNS41NjUNCgkJbC02LjM3MS05LjI0NWMtMC41NDQtMC43ODksMC4yNjYtMS44MDMsMS4xNTUtMS40NDlsMTAuNDMxLDQuMTU0bDMuMjU1LTEwLjc0NUMzOTEuNzAzLDE0Ni44MTEsMzkzLjAwMiwxNDYuODExLDM5My4yNzksMTQ3LjcyOXoiDQoJCS8+DQoJPHBhdGggc3R5bGU9ImZpbGw6I0Y1RjVGNTsiIGQ9Ik0zMjAuNzAyLDIzMC4yMDRsMy4yNTUsMTAuNzQ1bDEwLjQzMS00LjE1NGMwLjg4OS0wLjM1NCwxLjY5OSwwLjY2LDEuMTU1LDEuNDQ5bC02LjM3MSw5LjI0NQ0KCQlsOS43NTEsNS41NjVjMC44MzIsMC40NzQsMC41NDMsMS43NC0wLjQxMywxLjgwNmwtMTEuMiwwLjc4MmwxLjczLDExLjA5M2MwLjE0OCwwLjk0Ny0xLjAyMiwxLjUxLTEuNjcsMC44MDRsLTcuNTk1LTguMjY5DQoJCWwtNy41OTUsOC4yNjljLTAuNjQ4LDAuNzA1LTEuODE3LDAuMTQyLTEuNjctMC44MDRsMS43My0xMS4wOTNsLTExLjItMC43ODJjLTAuOTU2LTAuMDY3LTEuMjQ1LTEuMzMyLTAuNDEzLTEuODA2bDkuNzUxLTUuNTY1DQoJCWwtNi4zNzEtOS4yNDVjLTAuNTQ0LTAuNzg5LDAuMjY2LTEuODAzLDEuMTU1LTEuNDQ5bDEwLjQzMSw0LjE1NGwzLjI1NS0xMC43NDVDMzE5LjEyNiwyMjkuMjg3LDMyMC40MjQsMjI5LjI4NywzMjAuNzAyLDIzMC4yMDR6Ig0KCQkvPg0KCTxwYXRoIHN0eWxlPSJmaWxsOiNGNUY1RjU7IiBkPSJNNDYxLjk0MywxOTQuODkzbDMuMjU1LDEwLjc0NWwxMC40MzEtNC4xNTRjMC44ODktMC4zNTQsMS42OTksMC42NiwxLjE1NSwxLjQ0OWwtNi4zNzEsOS4yNDUNCgkJbDkuNzUxLDUuNTY1YzAuODMyLDAuNDc0LDAuNTQzLDEuNzQtMC40MTMsMS44MDZsLTExLjIsMC43ODJsMS43MywxMS4wOTNjMC4xNDgsMC45NDctMS4wMjIsMS41MS0xLjY3LDAuODA0bC03LjU5NS04LjI2OQ0KCQlsLTcuNTk1LDguMjY5Yy0wLjY0OCwwLjcwNS0xLjgxNywwLjE0Mi0xLjY2OS0wLjgwNGwxLjczLTExLjA5M2wtMTEuMi0wLjc4MmMtMC45NTYtMC4wNjctMS4yNDUtMS4zMzItMC40MTMtMS44MDZsOS43NTEtNS41NjUNCgkJbC02LjM3MS05LjI0NWMtMC41NDQtMC43ODksMC4yNjYtMS44MDMsMS4xNTUtMS40NDlsMTAuNDMxLDQuMTU0bDMuMjU1LTEwLjc0NUM0NjAuMzY3LDE5My45NzcsNDYxLjY2NSwxOTMuOTc3LDQ2MS45NDMsMTk0Ljg5M3oiDQoJCS8+DQoJPHBhdGggc3R5bGU9ImZpbGw6I0Y1RjVGNTsiIGQ9Ik0zOTMuMjc5LDMzNi4xMzVsMy4yNTUsMTAuNzQ1bDEwLjQzLTQuMTU1YzAuODg5LTAuMzU0LDEuNjk5LDAuNjYsMS4xNTUsMS40NDlsLTYuMzcxLDkuMjQ1DQoJCWw5Ljc1MSw1LjU2NWMwLjgzMiwwLjQ3NCwwLjU0MywxLjc0LTAuNDEzLDEuODA2bC0xMS4yLDAuNzgybDEuNzI5LDExLjA5M2MwLjE0OCwwLjk0Ny0xLjAyMiwxLjUxLTEuNjcsMC44MDRsLTcuNTk1LTguMjY5DQoJCWwtNy41OTUsOC4yNjljLTAuNjQ4LDAuNzA1LTEuODE3LDAuMTQyLTEuNjctMC44MDRsMS43MjktMTEuMDkzbC0xMS4yLTAuNzgyYy0wLjk1Ni0wLjA2Ni0xLjI0NS0xLjMzMi0wLjQxMy0xLjgwNmw5Ljc1MS01LjU2NQ0KCQlsLTYuMzcxLTkuMjQ1Yy0wLjU0NC0wLjc4OSwwLjI2Ni0xLjgwMywxLjE1NS0xLjQ0OWwxMC40MzEsNC4xNTVsMy4yNTUtMTAuNzQ1QzM5MS43MDMsMzM1LjIxOSwzOTMuMDAyLDMzNS4yMTksMzkzLjI3OSwzMzYuMTM1eiINCgkJLz4NCgk8cGF0aCBzdHlsZT0iZmlsbDojRjVGNUY1OyIgZD0iTTQxOC40NjEsMjQ5LjUxMmwtMi42MTMsNy44MzZsLTguMjU5LDAuMDY0Yy0xLjA2OSwwLjAwOS0xLjUxMywxLjM3My0wLjY1MiwyLjAwOGw2LjY0NCw0LjkwNw0KCQlsLTIuNDkyLDcuODc1Yy0wLjMyMiwxLjAyLDAuODM5LDEuODYzLDEuNzA4LDEuMjQxbDYuNzItNC44MDNsNi43Miw0LjgwM2MwLjg3LDAuNjIxLDIuMDMtMC4yMjIsMS43MDgtMS4yNDFsLTIuNDkyLTcuODc1DQoJCWw2LjY0NS00LjkwN2MwLjg2MS0wLjYzNiwwLjQxNy0xLjk5OS0wLjY1Mi0yLjAwOGwtOC4yNTktMC4wNjRsLTIuNjEzLTcuODM2QzQyMC4yMzQsMjQ4LjQ5OCw0MTguNzk5LDI0OC40OTgsNDE4LjQ2MSwyNDkuNTEyeiIvPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPC9zdmc+DQo=";

// var emptyRow = $("<div class=\"gm-row row\"></div>");
var onlyInactive = false;

var cache;
var col; // stores the column headlines + column index for the preflight run, after that, all columns should have corresponsing classes
var tags;

function isInactive(lastSeen) {
    var inactiveRegex = /.*(weeks|month|Never).*/g
    return inactiveRegex.test(lastSeen)
}

async function hideActiveMembers() {
    onlyInactive = true;
    await GM.setValue("gm-only-inactive", onlyInactive);
    updateHideActiveButton();
    updateTableView(onlyInactive);
}

async function showActiveMembers() {
    onlyInactive = false;
    await GM.setValue("gm-only-inactive", onlyInactive);
    updateHideActiveButton();
    updateTableView(onlyInactive);
}

function initView() {
    updateTableView(onlyInactive);
    updateHideActiveButton();
}

function updateTableView(hideActive) {
    $(".gm-row-player").each(function(){
        var lastSeenCell = $(this).find(".gm-td-ls-discord");
        var lastSeen = lastSeenCell.html();
        if(hideActive && !isInactive(lastSeen)) {
            $(this).hide();
        } else {
            $(this).show();
        }
    });
    $(".gm-row-group").each(function(){
        if(hideActive) {
        var sib = $(this).next();
        //if the next visible sibling is another group, hide this group
        while(sib.is(":hidden") && sib.is(".gm-row-player")) {
              sib = sib.next();
        }
        if(sib.is(".gm-row-group")){
           $(this).hide();
        }
        } else {
            $(this).show();
        }
    });
}

function updateLastSeenCellViaIngameName(ingameName, cell) {
    var destinyNameRegex =/\.*#\d+/g;
    if(! destinyNameRegex.test(ingameName)) {
        cell.append("N/A");
        return;
    }
    var uri = "https://www.bungie.net/Platform/Destiny2/SearchDestinyPlayer/4/" + ingameName + "/";
    $.ajax({
        url: uri.replace("#","%23"),
        method: "GET",
        crossDomain:true,
        headers: {
            "X-API-Key":"37de4c6ce0314acc981b0de9c705d2a3"
        },
        context: document.body,
        success: function(data) {
            try {
                updateLastSeenCellViaMembershipId(data.Response[0].membershipId, cell);
            } catch (err) {
                cell.append("N/A");
            }
        },
        error: function(data) {
            cell.append("N/A");
        }
    });
}

function updateLastSeenCellViaMembershipId(membershipid, cell) {
    $.ajax({
        url: "https://www.bungie.net/Platform/Destiny2/4/Profile/" + membershipid + "/",
        method: "GET",
        data: {
            "components":"100"
        },
        crossDomain:true,
        headers: {
            "X-API-Key":"37de4c6ce0314acc981b0de9c705d2a3"
        },
        context: document.body,
        success: function(data) {
            try {
                cell.append(daysFromNow(data.Response.profile.data.dateLastPlayed));
            } catch (err) {
                cell.append("N/A");
            }
        },
        error: function(data) {
            cell.append("N/A");
        },
    });
}

function daysFromNow(date){
    var msToDays = 1000*60*60*24;
    var msToHours = 1000*60*60;
    var msToMinutes = 1000*60;
    var fullDays = Math.floor((new Date() - new Date(date)) / msToDays);
    var remainingHours = Math.floor((new Date() - new Date(date)) / msToHours) - 24 * fullDays;
    var remainingMinutes = Math.floor((new Date() - new Date(date)) / msToMinutes) - 24 * fullDays - 60 * remainingHours;
    if(fullDays > 0){
        var fullWeeks = Math.floor(fullDays / 7);
        if (fullWeeks > 0) {
            if(fullWeeks == 1) {
                return fullWeeks + " week ago";
            } else {
                return fullWeeks + " weeks ago";
            }
        } else {
            if(fullDays == 1) {
                return fullDays + " day ago";
            } else {
                return fullDays + " days ago";
            }
        }
    } else {
        if (remainingHours > 0) {
            if(remainingHours == 1) {
                return remainingHours + " hour ago";
            } else {
                return remainingHours + " hours ago";
            }
        } else {
            if (remainingMinutes < 5) {
                return "Online";
            } else {
                return remainingMinutes + " minutes ago";
            }
        }
    }
}

function extractRegion(profilePage) {
    var regexRegion = /<span class=\"team-info__label\">Region:<\/span>\s*<span class="team-info__value ">(.*)<\/span>/g;
    var matchRegion = regexRegion.exec(profilePage);
    return matchRegion[1];
}

function extractIngameName(profilePage){
    var regexIngameName = /<span class=\"team-info__label\">In-Game Name:<\/span>\s*<span class="team-info__value ">(.*)<\/span>/g;
    var matchIngameName = regexIngameName.exec(profilePage);
    return matchIngameName[1];
}

function loadRegionsAndIngameNames(forceReload) {
    console.log("Loading regions");
    var xhrs = [];
    $(".alc-event-results-table > tbody > tr").each(function(i, data) {
        var row = $(this);
        if (row.children().length > 4) {
            var profileColumn = row.children().eq(5);
            var profUrl = profileColumn.children().first().attr("href");
            var urlRegex = /.*(\/profile\/.*)/g;
            var relativeUrl = urlRegex.exec(profUrl)[1];
            if(cache[relativeUrl] == undefined || forceReload) {
                var xhr = $.ajax({
                    url: relativeUrl,
                    context: document.body,
                    success: function(data) {
                        var region = extractRegion(data);
                        var ingameName = extractIngameName(data);
                        var regionCell = row.children().eq(1);
                        var lastSeenIngameCell = row.children().eq(3);
                        var profileCache = new Object();
                        profileCache.region = region;
                        profileCache.ingame = ingameName;
                        cache[relativeUrl] = profile;
                        updateRegionCell(regionCell, region);
                        updateLastSeenCell(lastSeenIngameCell, ingameName);
                    }
                });
                xhrs.push(xhr);
            } else {
                var regionCell = row.children().eq(1);
                var region = cache[relativeUrl].region;
                var lastSeenIngameCell = row.children().eq(3);
                var ingameName = cache[relativeUrl].ingame;
                updateRegionCell(regionCell, region);
                updateLastSeenCell(lastSeenIngameCell, ingameName);
            }
            if(xhrs.length > 0) {
                $.when.apply($, xhrs).done(saveRegionCache);
            }
        }
    })
}

function updateRegionCell(cell, region){
    if(region == "EU") {
        var iconEu = $('<img height = "1em">').attr('title', region).attr('src', euIcon64).css("height","30px");
        cell.empty();
        cell.append(iconEu);
    } else if (region == "NA") {
        var iconNa = $('<img height = "1em">').attr('title', region).attr('src', naIcon64).css("height","30px");
        cell.empty();
        cell.append(iconNa);
    } else if (region == "OC") {
        var iconOc = $('<img height = "1em">').attr('title', region).attr('src', ocIcon64).css("height","30px");
        cell.empty();
        cell.append(iconOc);
    } else {
        cell.html(region);
    }
}

function updateLastSeenCell(cell, ingameName){
    cell.empty();
    updateLastSeenCellViaIngameName(ingameName, cell);
}

function updateHideActiveButton(){
    if(onlyInactive) {
        hideActiveBtn.hide();
        showActiveBtn.show();
        showActiveBtn.css("margin-top","0");
    } else {
        hideActiveBtn.show();
        showActiveBtn.hide();
    }
}

function addGodModePanel() {
    var headline = $(".card__header");
    var divName = headline.html();
    //
    hideActiveBtn.on("click",hideActiveMembers);
    showActiveBtn.on("click",showActiveMembers);
    //
    headlineRow.find(".gm-divname").append(divName);
    //
    utilityRow.find(".gm-hide-active").append(hideActiveBtn);
    utilityRow.find(".gm-hide-active").append(showActiveBtn);
    //
    godModePanel.append(headlineRow);
    godModePanel.append(utilityRow);
    // exchange old and new header
    headline.empty();
    headline.html(godModePanel);
}

function fillLastSeenColumn(){
    console.log("Filling Regions");
    $(".gm-row-player").each(function() {
        var relativeUrl = $(this).attr("cachekey");
        var lastSeenCell = $(this).find(".gm-td-ls-destiny");
        var ingameName = cache[relativeUrl].ingame;
        updateLastSeenCell(lastSeenCell, ingameName);
    });
}


function fillRegionColumn(){
    console.log("Filling Regions");
    $(".gm-row-player").each(function() {
        var relativeUrl = $(this).attr("cachekey");
        var regionCell = $(this).find(".gm-td-region");
        var region = cache[relativeUrl].region;
        updateRegionCell(regionCell, region);
    });
}

function loadPlayerProfiles(forceReload) {
    console.log("Loading Player Profiles to Cache");
    var xhrs = [];
    $(".gm-row-player").each(function(i, data) {
        var row = $(this);
        var profileColumn = $(this).find(".gm-td-view-profile");
        var profUrl = profileColumn.children().first().attr("href");
        var urlRegex = /.*(\/profile\/.*)/g;
        var relativeUrl = urlRegex.exec(profUrl)[1];
        $(this).attr("cachekey", relativeUrl);
        if(cache[relativeUrl] == undefined || forceReload) {
            var xhr = $.ajax({
                url: relativeUrl,
                context: document.body,
                success: function(data) {
                    var region = extractRegion(data);
                    var ingameName = extractIngameName(data);
                    var regionCell = row.children().eq(1);
                    var lastSeenIngameCell = row.children().eq(3);
                    var profileCache = new Object();
                    profileCache.region = region;
                    profileCache.ingame = ingameName;
                    cache[relativeUrl] = profileCache;
                }
            });
            xhrs.push(xhr);
        }
    })
    if(xhrs.length > 0) {
        $.when.apply($, xhrs).done(saveRegionCache);
        console.log("Loaded " + xhrs.length + " new cache entries");
    } else {
        console.log("No new profiles found");
    }
}

async function retrieveInactiveOnly(){
    onlyInactive = await GM.getValue("gm-only-inactive");
}

async function retrieveCache(){
    var cacheValue = await GM.getValue("gm-region-map","{}");
    cache = await JSON.parse(cacheValue)
    console.log("Loaded region cache with " + Object.keys(cache).length + " entries");
}

async function saveRegionCache() {
    await GM.setValue("gm-region-map", JSON.stringify(cache));
}

function addColumnForGameActivity(){
    var pos = 3;
    $(".alc-event-results-table > thead > tr").children().eq(pos).before('<th class>Last Seen In Destiny</th>');
    for(var i = Object.keys(col).length; i >= pos+1; i--) {
        col[i] = col[i-1];
    }
    col[pos]="Last Seen In Destiny";
    $(".gm-row-player").each(function(){
        $(this).children().eq(pos).before('<td class="highlight gm-td gm-td-ls-destiny"></td>')
    });
    $(".gm-row-group").each(function(){
        var colspan = $(this).children().first().attr("colspan");
        $(this).children().first().attr("colspan", colspan + 1);
    });
}

function fixBrokenTableColumns(){
    var headerCount = $(".alc-event-results-table > thead > tr").children().length;
    $(".gm-row-player > td:not(.gm-td)").remove();
    $(".gm-row-player").each(function(){
        if($(this).children().length < headerCount) {
            $(this).append('<td class="gm-td gm-td-empty"></td>');
        }
    });
    $(".alc-event-results-table > tbody .gm-row-group").each(function() {
        $(this).children().first().attr("colspan", headerCount);
    })
}

function populateCol() {
    col = new Object();
    $(".alc-event-results-table > thead > tr").children().each(function(i, data) {
        var cell = $(this).first();
        col[i] = cell.html();
    });
}

function populateTags() {
    tags = new Object();
    tags["Name"]="gm-td-name";
    tags["Region"]="gm-td-region";
    tags["Recent Voice Activity"]="gm-td-voice-act";
    tags["Last Seen In Destiny"]="gm-td-ls-destiny";
    tags["Last Seen on Discord"]="gm-td-ls-discord";
    tags["View Profile"]="gm-td-view-profile"
}

function getGmClasses(headline) {
    var gmClasses = " gm-td";
    if (! (tags[headline] == undefined)) {
        gmClasses += " " + tags[headline];
    }
    return gmClasses;
}

function preflightTag() {
    populateCol();
    populateTags();
    var headerCount = $(".alc-event-results-table > thead > tr").children().length;
    $(".alc-event-results-table > tbody > tr").each(function(i, data) {
        var row = $(this);
        var elementCount = row.children().length;
        var isPlayerRow = row.children().length > 3;
        if(isPlayerRow){
            row.addClass("gm-row-player");
            row.find("td").each(function(j, dat){
                if(j < headerCount) {
                    var cell = $(this).first();
                    cell.addClass(getGmClasses(col[j]));
                }
            });
        } else {
            row.addClass("gm-row-group");
            row.children().first().addClass("gm-td gm-td-headline");
        }
    })
}

(async function() {
    await retrieveInactiveOnly();
    await retrieveCache();
    preflightTag();
    fixBrokenTableColumns();
    addColumnForGameActivity();
    loadPlayerProfiles(false);
    fillRegionColumn();
    fillLastSeenColumn();
    addGodModePanel();
    initView();
})();
