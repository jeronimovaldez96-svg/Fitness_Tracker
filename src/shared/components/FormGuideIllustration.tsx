import Svg, { Circle, Line, Rect } from 'react-native-svg';

import type { EquipmentFamily, MovementPattern } from '@/domains/catalog/utils/formGuide';

type FormGuideIllustrationProps = {
  /** Omit when only equipment is known (e.g. the active-workout card doesn't
   * track primary muscle) — renders the equipment glyph alone, centered. */
  movement?: MovementPattern;
  equipmentFamily: EquipmentFamily;
  size?: number;
  color: string;
};

const STROKE_WIDTH = 3.5;

/** Draws the bar/dumbbells/cable/machine glyph at a given pair of "hand" points. */
function EquipmentGlyph({
  family,
  leftHand,
  rightHand,
  color,
}: {
  family: EquipmentFamily;
  leftHand: [number, number];
  rightHand: [number, number];
  color: string;
}) {
  const commonProps = { stroke: color, strokeWidth: STROKE_WIDTH, strokeLinecap: 'round' as const, fill: 'none' };

  switch (family) {
    case 'bar':
      return (
        <>
          <Line x1={leftHand[0]} y1={leftHand[1]} x2={rightHand[0]} y2={rightHand[1]} {...commonProps} />
          <Line
            x1={leftHand[0]}
            y1={leftHand[1] - 5}
            x2={leftHand[0]}
            y2={leftHand[1] + 5}
            {...commonProps}
          />
          <Line
            x1={rightHand[0]}
            y1={rightHand[1] - 5}
            x2={rightHand[0]}
            y2={rightHand[1] + 5}
            {...commonProps}
          />
        </>
      );
    case 'handheld':
      return (
        <>
          <Circle cx={leftHand[0]} cy={leftHand[1]} r={5} stroke={color} strokeWidth={STROKE_WIDTH} fill="none" />
          <Circle cx={rightHand[0]} cy={rightHand[1]} r={5} stroke={color} strokeWidth={STROKE_WIDTH} fill="none" />
        </>
      );
    case 'cable':
      return (
        <>
          <Line x1={rightHand[0]} y1={rightHand[1]} x2={rightHand[0]} y2={4} {...commonProps} />
          <Circle cx={rightHand[0]} cy={4} r={4} stroke={color} strokeWidth={STROKE_WIDTH} fill="none" />
        </>
      );
    case 'machine':
      return (
        <Rect
          x={8}
          y={10}
          width={84}
          height={82}
          rx={2}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeOpacity={0.35}
          fill="none"
        />
      );
    case 'bodyweight':
      return null;
  }
}

/** Standing figure, arms bent, hands meeting in front of the chest. */
function PressPose({ family, color }: { family: EquipmentFamily; color: string }) {
  const leftHand: [number, number] = [30, 42];
  const rightHand: [number, number] = [70, 42];
  const strokeProps = { stroke: color, strokeWidth: STROKE_WIDTH, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <>
      {family === 'machine' ? <EquipmentGlyph family={family} leftHand={leftHand} rightHand={rightHand} color={color} /> : null}
      <Circle cx={50} cy={22} r={9} stroke={color} strokeWidth={STROKE_WIDTH} fill="none" />
      <Line x1={50} y1={31} x2={50} y2={62} {...strokeProps} />
      <Line x1={50} y1={62} x2={38} y2={90} {...strokeProps} />
      <Line x1={50} y1={62} x2={62} y2={90} {...strokeProps} />
      <Line x1={50} y1={36} x2={leftHand[0]} y2={leftHand[1]} {...strokeProps} />
      <Line x1={50} y1={36} x2={rightHand[0]} y2={rightHand[1]} {...strokeProps} />
      {family !== 'machine' ? <EquipmentGlyph family={family} leftHand={leftHand} rightHand={rightHand} color={color} /> : null}
    </>
  );
}

/** Torso leaning forward, arms bent pulling hands back toward the hip. */
function PullPose({ family, color }: { family: EquipmentFamily; color: string }) {
  const leftHand: [number, number] = [28, 58];
  const rightHand: [number, number] = [72, 58];
  const strokeProps = { stroke: color, strokeWidth: STROKE_WIDTH, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <>
      {family === 'machine' ? <EquipmentGlyph family={family} leftHand={leftHand} rightHand={rightHand} color={color} /> : null}
      <Circle cx={50} cy={24} r={9} stroke={color} strokeWidth={STROKE_WIDTH} fill="none" />
      <Line x1={50} y1={33} x2={56} y2={64} {...strokeProps} />
      <Line x1={56} y1={64} x2={46} y2={90} {...strokeProps} />
      <Line x1={56} y1={64} x2={64} y2={90} {...strokeProps} />
      <Line x1={52} y1={38} x2={leftHand[0]} y2={leftHand[1]} {...strokeProps} />
      <Line x1={52} y1={38} x2={rightHand[0]} y2={rightHand[1]} {...strokeProps} />
      {family !== 'machine' ? <EquipmentGlyph family={family} leftHand={leftHand} rightHand={rightHand} color={color} /> : null}
    </>
  );
}

/** Squat stance, bent knees, hands at shoulder height. */
function LegsPose({ family, color }: { family: EquipmentFamily; color: string }) {
  const leftHand: [number, number] = [28, 30];
  const rightHand: [number, number] = [72, 30];
  const strokeProps = { stroke: color, strokeWidth: STROKE_WIDTH, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <>
      {family === 'machine' ? <EquipmentGlyph family={family} leftHand={leftHand} rightHand={rightHand} color={color} /> : null}
      <Circle cx={50} cy={18} r={9} stroke={color} strokeWidth={STROKE_WIDTH} fill="none" />
      <Line x1={50} y1={27} x2={50} y2={54} {...strokeProps} />
      <Line x1={50} y1={54} x2={36} y2={70} {...strokeProps} />
      <Line x1={36} y1={70} x2={40} y2={92} {...strokeProps} />
      <Line x1={50} y1={54} x2={64} y2={70} {...strokeProps} />
      <Line x1={64} y1={70} x2={60} y2={92} {...strokeProps} />
      <Line x1={50} y1={30} x2={leftHand[0]} y2={leftHand[1]} {...strokeProps} />
      <Line x1={50} y1={30} x2={rightHand[0]} y2={rightHand[1]} {...strokeProps} />
      {family !== 'machine' ? <EquipmentGlyph family={family} leftHand={leftHand} rightHand={rightHand} color={color} /> : null}
    </>
  );
}

/** Reclined crunch pose, knees bent and raised. */
function CorePose({ family, color }: { family: EquipmentFamily; color: string }) {
  const leftHand: [number, number] = [38, 48];
  const rightHand: [number, number] = [50, 40];
  const strokeProps = { stroke: color, strokeWidth: STROKE_WIDTH, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <>
      <Circle cx={26} cy={58} r={9} stroke={color} strokeWidth={STROKE_WIDTH} fill="none" />
      <Line x1={34} y1={62} x2={54} y2={52} {...strokeProps} />
      <Line x1={54} y1={52} x2={70} y2={60} {...strokeProps} />
      <Line x1={70} y1={60} x2={86} y2={52} {...strokeProps} />
      <Line x1={54} y1={52} x2={68} y2={70} {...strokeProps} />
      <Line x1={68} y1={70} x2={86} y2={68} {...strokeProps} />
      <Line x1={40} y1={58} x2={leftHand[0]} y2={leftHand[1]} {...strokeProps} />
      <Line x1={40} y1={58} x2={rightHand[0]} y2={rightHand[1]} {...strokeProps} />
      {family !== 'bodyweight' ? <EquipmentGlyph family={family} leftHand={leftHand} rightHand={rightHand} color={color} /> : null}
    </>
  );
}

/**
 * Simple line-drawing "form guide" for an exercise, composed from a small
 * body pose (per movement pattern) plus an equipment glyph, rather than 94
 * bespoke per-exercise assets — see `formGuide.ts` for how the two are
 * derived from data the catalog already stores.
 */
export function FormGuideIllustration({ movement, equipmentFamily, size = 64, color }: FormGuideIllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {movement === undefined ? (
        <EquipmentGlyph family={equipmentFamily} leftHand={[35, 50]} rightHand={[65, 50]} color={color} />
      ) : movement === 'press' ? (
        <PressPose family={equipmentFamily} color={color} />
      ) : movement === 'pull' ? (
        <PullPose family={equipmentFamily} color={color} />
      ) : movement === 'legs' ? (
        <LegsPose family={equipmentFamily} color={color} />
      ) : (
        <CorePose family={equipmentFamily} color={color} />
      )}
    </Svg>
  );
}
