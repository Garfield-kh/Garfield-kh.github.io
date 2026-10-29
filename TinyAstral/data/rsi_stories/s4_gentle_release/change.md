# H15 → H16: open a little, back off, then open fully

**Change.** When a place lets go, the fingers now open only just past the contact width, the hand backs straight up, and only then do the fingers open fully. Before, the fingers opened fully while the fingertips were still down at the object; the swinging fingers could hit what was around it and throw it. Same waypoints, same final gripper state, same return values. Grasps already wide open (≥ 0.75) keep the old order.

- **Capability:** release order inside place/release/handover. Failure type: placement error (thrown object, OFF_TARGET).
- **Proposed by:** master agent, from an offline analysis of episodes that succeeded and were then undone: in 109 of the 214 such episodes, the harness's own motion caused the damage.
- **Evidence (ledger):** bench: 49 releases, 0 worse; two objects the old order threw (stacked bowl 52 / 411 cm, fan 68 / 201 cm) now land within 2–4 cm. Direction screen: +3.90 pp on 274 pairs. Accepted as part of H16 (+5.45 pp, lower bound +2.99 pp on 1,137 pairs). Target-task pairs where this path fired: 334 pairs, 72 wins / 37 losses (net +35).
- **This pair:** `move_playingcard_away`, seed 92248. Both runs make the same first two calls and then a `place` near x ≈ −35 cm. On H15 the first drop lands 3 cm off, and the automatic re-place opens the fingers at the table. The box ends up 43 cm away, upside down in the middle of the table (frame 003). The run then uses all 30 calls without recovering. On H16 the box lands 0.5 cm from the target and the task is done in 4 calls. The box sits at the left edge of the head camera, so it is barely visible in the last frame.

**Tool result, before vs after (`place(arm="left", object="playingcards", ref="table", xy=[~-35, -20])`):**

```diff
-{"code": "OFF_TARGET", "object_now": {"center": [-0.4, 8.2, 1.0]}, "placed_offset_cm": [32.6, 28.2],
- "first_attempt_offset_cm": [2.7, 1.6], "regrasped": true}
+{"code": "OK", "object_now": {"center": [-36.5, -19.6, 1.9]}, "placed_offset_cm": [-0.5, 0.3]}
+trace: {"exr_release": "partial open, back off up, then open fully"}
```

**Harness code:**

```diff
 def open_gently(self, arm):
-    # parent: open in steps to fully open while the fingertips are still at the object
+    o = float(self.A.opening(arm))
+    for v in (min(1.0, o + 0.05), min(1.0, o + EXR_PART_OPEN)):   # just past contact
+        self.run_seq({arm: [{"type": "grip", "val": v}]})
+    self._exr_pending = arm                                       # full opening only after the straight back-off
+
+def retreat(self, arm, total=0.10):
+    r = _EXRParent.retreat(self, arm, total)
+    if getattr(self, "_exr_pending", None) == arm: ...  # now open fully
```

