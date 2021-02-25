// import * as THREE from "three";
import { HydatPhase } from "../hydat";
import { Construct, parse } from "../parse";
import { phase_to_line_vectors } from "../plot_control";
import { Triplet } from "../plot_utils";

test('phase_to_line_vectors', () => {
  expect(phase_to_line_vectors(
    new HydatPhase({
      "children": [],
      "parameter_maps": [
        {
          "p[y, 0, 1]": {
            "lower_bounds": [
              {
                "value": "0"
              }
            ],
            "upper_bounds": [
              {
                "value": "10"
              }
            ]
          }
        }
      ],
      "simulation_state": "SIMULATED",
      "time": {
        "time_point": "0"
      },
      "type": "PP",
      "variable_map": {
        "y": {
          "unique_value": "p[y, 0, 1]"
        },
        "y'": {
          "unique_value": "0"
        },
        "y''": {
          "unique_value": "-10"
        }
      }
    }),
    new Map(),
    new Triplet<Construct>(parse("t"),parse("y"),parse("0")),
    0.1
  )).toEqual([]);
});
