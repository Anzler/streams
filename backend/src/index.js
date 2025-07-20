"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var supabase_js_1 = require("@supabase/supabase-js");
var tmdb_js_1 = require("./tmdb.js");
var app = (0, express_1.default)().use(express_1.default.json());
var supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
app.get('/search', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var q, results;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                q = req.query.q;
                if (!q)
                    return [2 /*return*/, res.status(400).json({ error: 'q required' })];
                return [4 /*yield*/, (0, tmdb_js_1.tmdbSearch)(q)];
            case 1:
                results = _a.sent();
                //   Return only movies/TV with a name field
                res.json(results.results.filter(function (r) { return ['movie', 'tv'].includes(r.media_type); }));
                return [2 /*return*/];
        }
    });
}); });
/**
 * POST /add
 * body: { userId, tmdbId, mediaType, name, year, posterPath, bucket }
 */
app.post('/add', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, tmdbId, mediaType, name, year, posterPath, bucket, existing, titleId, _b, data, error, wlErr;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = req.body, userId = _a.userId, tmdbId = _a.tmdbId, mediaType = _a.mediaType, name = _a.name, year = _a.year, posterPath = _a.posterPath, bucket = _a.bucket;
                return [4 /*yield*/, supabase
                        .from('titles')
                        .select('id')
                        .eq('tmdb_id', tmdbId)
                        .eq('media_type', mediaType)
                        .limit(1)
                        .maybeSingle()];
            case 1:
                existing = (_c.sent()).data;
                titleId = existing === null || existing === void 0 ? void 0 : existing.id;
                if (!!titleId) return [3 /*break*/, 3];
                return [4 /*yield*/, supabase.from('titles').insert({
                        tmdb_id: tmdbId,
                        media_type: mediaType,
                        name: name,
                        release_year: year,
                        poster_path: posterPath
                    }).select('id').single()];
            case 2:
                _b = _c.sent(), data = _b.data, error = _b.error;
                if (error)
                    return [2 /*return*/, res.status(500).json(error)];
                titleId = data.id;
                _c.label = 3;
            case 3: return [4 /*yield*/, supabase.from('watchlist').insert({
                    user_id: userId,
                    title_id: titleId,
                    bucket: bucket
                })];
            case 4:
                wlErr = (_c.sent()).error;
                if (wlErr && wlErr.code !== '23505') // ignore unique violation
                    return [2 /*return*/, res.status(500).json(wlErr)];
                // 3.  Trigger provider fetch immediately (fire‑and‑forget)
                fetch("".concat(process.env.INTERNAL_BASE_URL, "/refresh/").concat(titleId)).catch(console.error);
                res.json({ ok: true });
                return [2 /*return*/];
        }
    });
}); });
/**
 * GET /refresh/:titleId  (internal use and cron)
 */
app.get('/refresh/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, title, providers;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                id = req.params.id;
                return [4 /*yield*/, supabase.from('titles').select('*').eq('id', id).single()];
            case 1:
                title = (_a.sent()).data;
                if (!title)
                    return [2 /*return*/, res.status(404).send('not found')];
                return [4 /*yield*/, (0, tmdb_js_1.tmdbProviders)(title.tmdb_id, title.media_type, process.env.WATCH_REGION)];
            case 2:
                providers = _a.sent();
                return [4 /*yield*/, supabase.from('titles').update({
                        providers_json: providers || {},
                        last_provider_sync: new Date().toISOString()
                    }).eq('id', id)];
            case 3:
                _a.sent();
                res.send('ok');
                return [2 /*return*/];
        }
    });
}); });
