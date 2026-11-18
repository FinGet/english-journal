import React, { useId } from 'react';
import project from '../../project.config.json';
import type { Shot, Visual } from './types';
import { progress } from './visual-motion';

type Flight = Extract<Visual, { kind: 'spaceflight' }>;
const { width: W, height: H } = project.video;
// Fixed geometry keeps seeking and continuous playback identical.
const scatter = (n: number) => ((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1;
const stars = Array.from({ length: 520 }, (_, i) => ({ x: scatter(i + 1) * W, y: scatter(i + 700) * H, depth: .25 + scatter(i + 1400) * .75, radius: .6 + scatter(i + 2100) * 1.7 }));
const dust = Array.from({ length: 320 }, (_, i) => {
  const t = scatter(i + 3000), spread = (scatter(i + 3500) - .5) * 260;
  return { x: -300 + t * 1600 + spread, y: 1900 - t * 1300 + spread * .9, r: .6 + scatter(i + 4000) * 1.5 };
});

const Rocket: React.FC<{ id: string; frame: number; ignition: number }> = ({ id, frame, ignition }) => {
  const plume = 235 + Math.sin(frame * .16) * 9;
  return <g>
    <g opacity={ignition}>
      <path d={`M-27 124C-64 226 -25 ${190 + plume} 0 ${210 + plume}C25 ${190 + plume} 64 226 27 124Z`} fill={`url(#${id}-exhaust-halo)`} />
      <path d={`M-17 124C-33 215 -12 ${170 + plume * .75} 0 ${200 + plume * .75}C12 ${170 + plume * .75} 33 215 17 124Z`} fill={`url(#${id}-exhaust)`} />
      <path d={`M-9 127Q-12 190 0 ${190 + plume * .3}Q12 190 9 127Z`} fill="#f4fbff" opacity={.95} />
      <ellipse cy={134} rx={22} ry={12} fill="#d4f1ff" opacity={.8} />
    </g>
    <path d="M-35 52Q-74 72-76 132L-30 105M35 52Q74 72 76 132L30 105" fill="#a65e49" stroke="#d39980" strokeWidth={1.8} />
    <path d="M-69 121L-39 83M69 121L39 83" stroke="#592f2d" strokeWidth={3} opacity={.7} />
    <path d="M-27 100L-23 126Q0 139 23 126L27 100" fill="#3f5867" stroke="#8fa9b4" strokeWidth={2} />
    <path d="M-39 94V-12Q-38-104 0-155Q38-104 39-12V94Q0 119-39 94Z" fill={`url(#${id}-metal)`} stroke="#c2d0d6" strokeWidth={1.8} />
    <path d="M-34-65Q-22-123 0-155Q22-123 34-65Q0-78-34-65Z" fill={`url(#${id}-nose)`} />
    <path d="M-21-85Q-13-119-1-138" fill="none" stroke="#ffcfac" strokeWidth={3} opacity={.65} strokeLinecap="round" />
    <path d="M-39 61Q0 73 39 61V76Q0 89-39 76Z" fill="#a35d48" />
    <path d="M-37-30Q0-39 37-30M-39 36Q0 46 39 36M-28 97Q0 108 28 97" fill="none" stroke="#516977" strokeWidth={1.6} opacity={.6} />
    <ellipse cy={-10} rx={24} ry={27} fill="#415c6e" stroke="#a8bfc8" strokeWidth={5} />
    <ellipse cy={-10} rx={17} ry={20} fill={`url(#${id}-glass)`} />
    <path d="M-11-23L4-29M-13-13L12-24" stroke="#d9f5ff" strokeWidth={2.5} strokeLinecap="round" opacity={.7} />
    {[-27, 27].map(x => <g key={x}>{[-36, 33, 81].map(y => <circle key={y} cx={x} cy={y} r={1.9} fill="#5f7784" />)}</g>)}
    <path d="M-7 62V121L0 141L7 121V62Z" fill="#8a4c40" stroke="#d49679" strokeWidth={1.5} />
    <path d="M-28-48L-28-7M-29 10V24" stroke="#fff" strokeWidth={2.5} opacity={.45} strokeLinecap="round" />
    <circle cx={31} cy={48} r={2.4} fill="#ceeadb" />
  </g>;
};

export const SpaceflightVisual: React.FC<{ visual: Flight; shot: Shot; frame: number }> = ({ visual, shot, frame }) => {
  const id = `flight-${useId().replace(/:/g, '')}`;
  const local = Math.max(0, frame - shot.from);
  const travel = (start: number, end: number) => Math.max(0, Math.min(1, (frame - start) / (end - start)));
  const reveal = progress(frame, visual.revealAt, visual.launchAt - visual.revealAt);
  const launch = travel(visual.launchAt, visual.cruiseAt) ** 1.35;
  const cruise = travel(visual.cruiseAt, shot.to);
  const establish = travel(shot.from, visual.revealAt);
  const ignition = progress(frame, visual.launchAt - 72, 84);
  const earthX = 330 - launch * 300 - cruise * 350;
  const earthY = 1240 + launch * 380 + cruise * 400;
  const earthScale = 1 + establish * .045 - launch * .48 - cruise * .27;
  const rocketX = 770 - reveal * 90 - launch * 75 + cruise * 155;
  const rocketY = 1380 - reveal * 320 - launch * 330 - cruise * 205;
  const rocketScale = 1.28 - launch * .2 - cruise * .55;
  const drift = local * .13 + launch * 100 + cruise * 150;
  return <svg data-journal="spaceflight" width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
    <defs>
      <radialGradient id={`${id}-space`} cx="70%" cy="35%" r="90%"><stop stopColor="#192d49" /><stop offset=".45" stopColor="#0b182d" /><stop offset="1" stopColor="#040b17" /></radialGradient>
      <linearGradient id={`${id}-nebula`} x1="0" y1="1" x2="1" y2="0"><stop stopColor="#304154" stopOpacity="0" /><stop offset=".35" stopColor="#6b657b" stopOpacity=".4" /><stop offset=".65" stopColor="#4d7b8e" stopOpacity=".36" /><stop offset="1" stopColor="#487184" stopOpacity="0" /></linearGradient>
      <radialGradient id={`${id}-bloom`}><stop stopColor="#afc7d0" stopOpacity=".28" /><stop offset=".3" stopColor="#74859a" stopOpacity=".12" /><stop offset="1" stopColor="#44536e" stopOpacity="0" /></radialGradient>
      <radialGradient id={`${id}-ocean`} cx="30%" cy="25%" r="80%"><stop stopColor="#6794a4" /><stop offset=".4" stopColor="#285574" /><stop offset=".8" stopColor="#16334f" /><stop offset="1" stopColor="#08172e" /></radialGradient>
      <radialGradient id={`${id}-night`} cx="20%" cy="25%" r="95%"><stop offset=".25" stopColor="#010716" stopOpacity="0" /><stop offset=".54" stopColor="#020817" stopOpacity=".12" /><stop offset=".73" stopColor="#020817" stopOpacity=".83" /><stop offset="1" stopColor="#01050e" stopOpacity=".98" /></radialGradient>
      <radialGradient id={`${id}-atmosphere`}><stop offset=".94" stopColor="#8cdaee" stopOpacity="0" /><stop offset=".974" stopColor="#89d6ee" stopOpacity=".22" /><stop offset=".988" stopColor="#d3f3ff" stopOpacity=".64" /><stop offset="1" stopColor="#91ceee" stopOpacity="0" /></radialGradient>
      <linearGradient id={`${id}-metal`}><stop stopColor="#718998" /><stop offset=".23" stopColor="#d7e2e5" /><stop offset=".52" stopColor="#f4f2e9" /><stop offset=".78" stopColor="#bac9cf" /><stop offset="1" stopColor="#627987" /></linearGradient>
      <linearGradient id={`${id}-nose`}><stop stopColor="#754538" /><stop offset=".35" stopColor="#d59270" /><stop offset=".65" stopColor="#bc795f" /><stop offset="1" stopColor="#714139" /></linearGradient>
      <linearGradient id={`${id}-glass`} x2=".8" y2="1"><stop stopColor="#d3eced" /><stop offset=".3" stopColor="#5590a3" /><stop offset="1" stopColor="#163049" /></linearGradient>
      <linearGradient id={`${id}-exhaust`} x1="0" x2="0" y2="1"><stop stopColor="#e0f9ff" /><stop offset=".2" stopColor="#f9dfa3" /><stop offset=".65" stopColor="#d49b68" stopOpacity=".7" /><stop offset="1" stopColor="#a95b53" stopOpacity="0" /></linearGradient>
      <linearGradient id={`${id}-exhaust-halo`} x1="0" x2="0" y2="1"><stop stopColor="#91cee4" stopOpacity=".3" /><stop offset="1" stopColor="#7898b8" stopOpacity="0" /></linearGradient>
      <linearGradient id={`${id}-caption-shade`} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#040b17" stopOpacity="0" /><stop offset=".5" stopColor="#040b17" stopOpacity=".35" /><stop offset="1" stopColor="#040b17" stopOpacity=".7" /></linearGradient>
      <clipPath id={`${id}-earth-clip`}><circle r={500} /></clipPath>
      <g id={`${id}-land`}>
        <path d="M-449-258Q-429-296-398-309L-373-344L-345-337L-315-361L-273-357L-247-333L-225-332L-207-311L-179-308L-157-282L-135-275L-128-249L-102-227L-119-201L-141-198L-134-174L-161-164L-180-173L-181-142L-206-131L-206-108L-224-87L-247-112L-269-111L-282-139L-306-142L-324-158L-351-162L-368-183L-402-170L-417-199L-439-214Z" />
        <path d="M-224-61Q-198-72-166-64L-143-43L-129-48L-110-17L-91 7L-83 44L-94 72L-91 106L-113 142L-129 180L-141 193L-149 226L-170 258L-195 290L-203 259L-197 225L-214 196L-221 157L-241 131L-242 108L-264 87L-255 59L-259 27L-241 7L-241-29Z" />
        <path d="M4-289L36-310L75-326L94-306L114-315L140-305L153-279L131-260L135-241L113-228L88-234L70-208L50-185L58-165L81-148L107-156L133-151L151-126L166-112L154-87L156-55L134-30L123 4L105 29L95 65L77 97L45 131L26 112L7 87L1 58L-12 21L-32 5L-48-16L-51-54L-60-91L-48-122L-23-145L-29-165L-40-183L-20-210L-3-225L-14-257Z" />
        <path d="M139-313L169-334L202-343L236-326L263-332L290-318L305-291L336-275L347-257L381-265L419-255L430-224L454-208L468-180L455-147L434-126L437-99L412-81L385-76L373-49L350-17L329-38L307-36L290-67L274-83L260-106L236-105L211-122L205-151L184-184L159-185L132-211L140-239L126-267Z" />
        <path d="M294 172L321 165L343 151L361 155L380 175L404 180L416 202L429 235L411 251L382 270L358 256L334 259L315 247L293 247L278 215Z" />
        <path d="M-262-396Q-214-414-183-396L-169-356L-193-325L-216-345L-245-351Z M168 78Q184 99 174 136L163 157L153 141L158 108Z M355-73L374-65L390-23L380-12L367-39Z" />
        <path d="M-470 401Q-201 350-106 397T204 400T497 414L500 550H-500Z" />
      </g>
      <clipPath id={`${id}-land-clip`}><use href={`#${id}-land`} /></clipPath>
      <filter id={`${id}-nebula-blur`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation={42} /></filter>
      <filter id={`${id}-cloud-blur`}><feGaussianBlur stdDeviation={2} /></filter>
    </defs>
    <rect width={W} height={H} fill={`url(#${id}-space)`} />
    <g transform={`translate(${-drift * .12} ${drift * .06})`}>
      <ellipse cx={700} cy={910} rx={850} ry={710} fill={`url(#${id}-bloom)`} />
      <g fill="none" stroke={`url(#${id}-nebula)`} filter={`url(#${id}-nebula-blur)`}>
        <path d="M-320 1840C-30 1530 160 1300 430 1130S910 880 1330 440" strokeWidth={160} />
        <path d="M-260 1670C100 1610 290 1260 490 1190S920 800 1330 720" strokeWidth={90} />
      </g>
      <path d="M-200 1830C200 1470 290 1210 590 1070S950 810 1280 590" fill="none" stroke="#040b17" strokeWidth={38} opacity={.36} filter={`url(#${id}-nebula-blur)`} />
      {dust.map((star, i) => <circle key={i} cx={star.x} cy={star.y} r={star.r} fill={i % 4 ? '#bdccd5' : '#e9d9bd'} opacity={.14 + scatter(i + 4500) * .3} />)}
    </g>
    {stars.map((star, i) => {
      const y = (star.y + drift * star.depth) % H;
      return <g key={i} opacity={.22 + star.depth * .64}>
        {i % 31 === 0 && <circle cx={star.x} cy={y} r={star.radius * 4} fill="#aec7dd" opacity={.08} />}
        <circle cx={star.x} cy={y} r={star.radius} fill={i % 9 ? '#d4e0ec' : '#e6c8ac'} />
        {i % 49 === 0 && <path d={`M${star.x - 5} ${y}h10M${star.x} ${y - 5}v10`} stroke="#e2edf4" strokeWidth={.65} opacity={.45} />}
      </g>;
    })}
    <g transform={`translate(${earthX} ${earthY}) scale(${earthScale})`}>
      <circle r={518} fill="#76cae8" opacity={.035} />
      <circle r={509} fill="#8ad8ee" opacity={.045} />
      <circle r={500} fill={`url(#${id}-ocean)`} />
      <g clipPath={`url(#${id}-earth-clip)`}>
        <g transform={`rotate(${-14 + local * .008}) translate(${-local * .025} 0)`}>
          <use href={`#${id}-land`} fill="#718978" stroke="#96a796" strokeWidth={1.3} />
          <g clipPath={`url(#${id}-land-clip)`}>
            <path d="M-390-300Q-260-312-168-209L-189-137L-293-174Z M-12-140L108-174L153-76L101-11L-10-36Z M184-246L383-225L407-139L245-148Z" fill="#aca78a" opacity={.3} />
            {Array.from({ length: 120 }, (_, i) => <ellipse key={i} cx={-440 + scatter(i + 5400) * 880} cy={-400 + scatter(i + 5600) * 800} rx={4 + scatter(i + 5800) * 15} ry={2 + scatter(i + 6000) * 8} fill={i % 2 ? '#bac2a2' : '#365f55'} opacity={.14} transform={`rotate(${i * 37})`} />)}
          </g>
          <g fill="#e1ece9" opacity={.26} filter={`url(#${id}-cloud-blur)`}>
            <path d="M-464-230Q-421-263-380-240Q-362-270-333-247Q-282-254-260-217Q-290-194-324-207Q-369-186-399-211Q-437-198-464-230Z M-90-306Q-34-345 21-319Q41-350 84-321Q118-323 149-293Q116-275 75-291Q37-271-3-292Q-54-279-90-306Z" />
            <path d="M-288 82Q-240 45-206 70Q-166 41-136 80Q-108 68-84 101Q-124 118-154 103Q-190 123-225 100Q-263 110-288 82Z M80 151Q135 114 166 142Q195 126 226 157Q259 148 296 180Q265 195 226 184Q192 206 158 181Q113 187 80 151Z" />
            <path d="M235-75Q267-113 308-91Q338-113 372-86Q414-88 441-56Q401-37 370-56Q332-37 303-61Q264-46 235-75Z" />
          </g>
          <g fill="none" stroke="#dbe9e6" strokeLinecap="round" filter={`url(#${id}-cloud-blur)`}>
            <path d="M-468-180Q-320-245-229-177T-50-166M-127-310Q-18-363 92-318T309-290M-438 52Q-321 16-255 65T-76 84M-26 163Q71 111 171 157T402 131M190-20Q302-74 415-6" strokeWidth={13} opacity={.4} />
            <path d="M-438-151Q-329-207-227-151M-214 18Q-102-14-27 36M-43 194Q76 148 193 193M166-192Q291-238 423-165" strokeWidth={6} opacity={.48} />
            <path d="M-334 271Q-124 211 47 267T396 283" strokeWidth={19} opacity={.26} />
          </g>
        </g>
        <circle r={500} fill={`url(#${id}-night)`} />
        <g transform={`rotate(${-14 + local * .008}) translate(${-local * .025} 0)`}>
          <g clipPath={`url(#${id}-land-clip)`}>{Array.from({ length: 65 }, (_, i) => <circle key={i} cx={100 + scatter(i + 5000) * 300} cy={-260 + scatter(i + 5100) * 410} r={.9 + scatter(i + 5200) * 1.4} fill="#e3bd7e" opacity={.2 + scatter(i + 5300) * .42} />)}</g>
        </g>
      </g>
      <circle r={507} fill={`url(#${id}-atmosphere)`} />
      <path d="M-471-170A500 500 0 0 1 72-495" fill="none" stroke="#d3f0fa" strokeWidth={2.6} opacity={.6} />
    </g>
    <g transform={`translate(${rocketX} ${rocketY}) rotate(${25 - reveal * 6 + launch * 7}) scale(${rocketScale})`} opacity={progress(frame, visual.revealAt, 48)}>
      <Rocket id={id} frame={frame} ignition={ignition} />
    </g>
    <rect y={1400} width={W} height={520} fill={`url(#${id}-caption-shade)`} />
    <g fill="#bbccdb" opacity={.65} fontSize={19} letterSpacing={2}>
      <text x={project.layout.left} y={H - 135}>FICTION · ILLUSTRATED JOURNEY</text>
      <text x={project.layout.left} y={H - 102} fontSize={22} letterSpacing={.5}>{visual.label}</text>
    </g>
  </svg>;
};
