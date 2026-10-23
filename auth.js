/* =====================================================================
   RAVIN QC — shared login / session module (no backend; localStorage only)
   Loaded on every page (login page + app + the report pages) as a plain
   script (not a module) so it can be used from inline code too.
   ===================================================================== */
(function (global) {
  "use strict";
  var SESSION_KEY = "ravin_qc_session_v1";

  // Branch codes (used to populate dropdowns and to recognize branch-login usernames)
  var BRANCHES = [
    "SUZ","OCT","HRM","HDQ","HLW","MOK","ALX3","ZTN","ZQZ","ARK","MDI","MOE",
    "DMT","MHL","BSF","LBN","SHB","ALX2","SNZ","MNS2","CIT","TNT1","SBR",
    "HDH","RH2","CST","ARB","GEN","GSR","ISM","SSH2","FYM","SSH3"
  ];

  // Head-office / auditor accounts: full read+write access across all branches.
  var STAFF_USERS = {
    SHAKER: { password: "1642", role: "admin",   displayName: "Shaker" },
    SOUODY: { password: "2222", role: "auditor", displayName: "Souody" },
    AMR:    { password: "3333", role: "auditor", displayName: "Amr" },
    ESLAM:  { password: "4444", role: "auditor", displayName: "Eslam" }
  };

  function branchPassword(code) { return code + "0000"; }

  function login(username, password) {
    var uname = String(username || "").trim().toUpperCase();
    var pass = String(password || "").trim();
    if (!uname || !pass) return null;

    if (STAFF_USERS[uname] && STAFF_USERS[uname].password === pass) {
      var u = STAFF_USERS[uname];
      var session = {
        username: uname, role: u.role, branch: null,
        displayName: u.displayName, loginAt: Date.now()
      };
      saveSession(session);
      return session;
    }
    if (BRANCHES.indexOf(uname) > -1 && branchPassword(uname) === pass) {
      var session2 = {
        username: uname, role: "branch", branch: uname,
        displayName: uname, loginAt: Date.now()
      };
      saveSession(session2);
      return session2;
    }
    return null;
  }

  function saveSession(s) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {}
  }
  function getSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function logout() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }
  function isStaff(s) { s = s || getSession(); return !!s && (s.role === "admin" || s.role === "auditor"); }
  function isBranch(s) { s = s || getSession(); return !!s && s.role === "branch"; }

  /** Call once a page is ready to redirect if there's no session. Does NOT
   *  prevent the flash-of-content on its own — pages also carry a tiny
   *  blocking inline guard at the very top of <head> for that. */
  function guard(loginPath) {
    var s = getSession();
    if (!s) { location.replace(loginPath || "index.html"); return null; }
    return s;
  }

  /** Staff-only pages (reports, money map tools meant for HQ use) call this
   *  after guard() to bounce branch accounts back to the app home. */
  function requireStaff(session, redirectPath) {
    if (isBranch(session)) { location.replace(redirectPath || "app.html"); return false; }
    return true;
  }

  function roleLabelAr(role) {
    if (role === "admin") return "أدمن";
    if (role === "auditor") return "مراجع";
    if (role === "branch") return "فرع";
    return "";
  }

  global.RavinAuth = {
    BRANCHES: BRANCHES,
    STAFF_USERS: STAFF_USERS,
    login: login,
    getSession: getSession,
    logout: logout,
    isStaff: isStaff,
    isBranch: isBranch,
    guard: guard,
    requireStaff: requireStaff,
    roleLabelAr: roleLabelAr
  };
})(window);
