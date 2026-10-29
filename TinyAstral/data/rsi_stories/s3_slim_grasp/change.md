# H15 → H16: grasp tall slender objects with fingers closing horizontally

**Change.** For an object the cameras see standing tall and slender (height ≥ 10 cm and ≥ 2× its footprint, footprint ≤ 8.5 cm), every side or tilted grasp now closes the fingers horizontally across the object. Before, the closing axis came from the footprint's narrow direction, which is arbitrary on a round bottle: on a tilted approach one finger landed above the other and closing tipped the bottle over. The steepest (60°) approach is no longer used for such objects. A second part checks the path to the pre-grasp pose against the point cloud and goes over standing objects instead of sweeping through them.

- **Capability:** grasp candidates for tall slender objects (axis + no60) and sweep check. Failure type: grasp failure (knocked over / slipped).
- **Proposed by:** master agent, from a failure cluster of knocked-over bottles.
- **Evidence (ledger):** bench: tall-slender grasps 18/32 → 25/32, objects knocked over 11 → 4. Direction screen: +26.15 pp on the 6 target tasks. Accepted as part of H16: paired A/B on 1,137 dev pairs, +5.45 pp, one-sided 97.5% lower bound +2.99 pp. Target-task pairs where this path fired: 126 pairs, 41 wins / 10 losses (net +31).
- **This pair:** `pick_dual_bottles`, seed 92205. The first two calls are identical in both runs. On H15 the right-arm grasp needs 3 attempts and ends up holding a toppled bottle (grasp point 5 cm above the table); the planner then spends 8 calls nudging the arms and declares done, but the task fails. On H16 the right grasp switches tilt (`changed_tilt: true`), both bottles come up upright, and the task is done in 4 calls.

**Tool result, before vs after (same call: `bimanual` grasp of bottle_1 + bottle_2):**

```diff
-"right": {"code": "OK", "grasp_point_cm": [30.9, 18.1, 5.3], "approach": "tilted", "attempts": 3}   # bottle tipped over
+"right": {"code": "OK", "grasp_point_cm": [18.4, 8.0, 17.4], "approach": "tilted", "attempts": 2}
+trace: {"exg_axis": {"tilt": 75, "point_cm": [18.4, 8.0, 17.4], "changed_tilt": true}}, {"exg_sweep": {"obj": "bottle_2", "hits": 0}}
```

**Harness code (candidate list for tall objects):**

```diff
 base = G.candidates(s, arm, tilts=(90.0, 75.0, 60.0))
+if "axis" in EXG_PARTS and self._exg_slim(s):
+    tilts = (90.0, 75.0)                              # no60: the 60 deg approach tipped 4 of 4 on the bench
+    for al in tilts:
+        a  = G.unit(np.r_[r[:2] * np.sin(np.radians(al)), -np.cos(np.radians(al))])   # approach
+        hz = G.unit(np.cross([0.0, 0.0, 1.0], a))   # close the fingers horizontally, across the object
+        out += [(al, a, hz), (al, a, -hz)]
```

