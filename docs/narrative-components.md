# 第二批组件：导演方案与配置

此页先定义第二批的观看对象与动作，再据此实现公共组件。所有示例仅说明配置，不代表用户经历或已确认原话；不改写当前期数，不创建演示合成。实现后按制作规范完成必要检查、预览和连续审查。

| 组件 | 起始 → 动作 → 结果 | 人物 |
| --- | --- | --- |
| scene | 明确标记示意场景，人物/物件在位置上建立关系 → 指定对象按词锚移动 → 保留位置与动作说明 | chip，场景在上部，动作说明在右下 |
| transformation | 同一组带稳定ID的对象 → 在散乱、分组、排列之间重组 → 状态轨迹与原对象保持可见 | chip，状态说明在右下 |
| relationship | 节点建立 → 有向连线逐条绘出 → 可见影响、阻碍和反馈循环 | chip，网络在上部 |
| map | 地点与示意路网建立 → 路线绘制、标记从起点移向终点并轻微推近 → 到达后回到全貌 | chip，路线在上部，当前路段在右下 |
| emotion | 大人物保持 → 按词锚改变边缘线条的密度、幅度与色彩，短句和关键词同步更新 → 表达感受的变化 | hero；标题由组件承担，titles必须为空；纹样只在人物画框边缘，字幕始终最高层 |

所有at/arriveAt使用成片30fps全局帧，必须处于所属镜头的[from,to)；每组beats/states按at严格递增。动画根据帧计算，不用随机数、播放事件或定时器。例子须用真实词锚替换，并留足阅读和动作时间。

## scene：场景内动作

setting最多28字符；actors为2–5个，ID唯一，label最多18字符。shape为person/desk/phone/door/object。x/y是场景区域中的中心比例，范围0.15–0.85。beats为1–5个，actor引用已有ID，触发不得早于该对象的at，text最多40字符。对象每次移动从此前位置平滑过渡，同一人物身份不变。场景固定显示SCHEMATIC，避免示意图被误认成真实现场。

例一：会议中从座位走向同事。

```json
{"kind":"scene","setting":"After the meeting","actors":[{"id":"me","label":"Me","shape":"person","at":300,"x":0.25,"y":0.5},{"id":"colleague","label":"My colleague","shape":"person","at":300,"x":0.75,"y":0.5},{"id":"desk","label":"The table","shape":"desk","at":300,"x":0.5,"y":0.8}],"beats":[{"at":390,"actor":"me","x":0.55,"y":0.5,"text":"I walked over to ask."}]}
```

例二：到门口才发现忘带手机。

```json
{"kind":"scene","setting":"Leaving home","actors":[{"id":"me","label":"Me","shape":"person","at":900,"x":0.25,"y":0.5},{"id":"door","label":"The door","shape":"door","at":900,"x":0.8,"y":0.5},{"id":"phone","label":"My phone","shape":"phone","at":900,"x":0.2,"y":0.8}],"beats":[{"at":990,"actor":"me","x":0.65,"y":0.5,"text":"Then I remembered my phone."},{"at":1080,"actor":"me","x":0.25,"y":0.5,"text":"I had to go back."}]}
```

## transformation：同一对象的状态变化

subject最多28字符；items为3–6个稳定ID及短词（text最多16字符），各状态共用同一组对象，不把两个不相关结果冒充过程。states为2–4个，label最多28字符；layout为scattered/grouped/aligned。对象位置、尺寸和角度随状态平滑变化；旧状态名留在轨迹中，不能用此组件伪造数量统计。

例一：把零散想法整理成计划。

```json
{"kind":"transformation","subject":"Making a plan","items":[{"id":"a","text":"Ideas"},{"id":"b","text":"Priorities"},{"id":"c","text":"Next steps"}],"states":[{"at":300,"label":"Too many loose ends","layout":"scattered"},{"at":420,"label":"Find the connections","layout":"grouped"},{"at":540,"label":"One clear plan","layout":"aligned"}]}
```

例二：把练习任务安排成日常顺序。

```json
{"kind":"transformation","subject":"A daily routine","items":[{"id":"listen","text":"Listen"},{"id":"speak","text":"Speak"},{"id":"record","text":"Record"},{"id":"reflect","text":"Reflect"}],"states":[{"at":900,"label":"Whenever I had time","layout":"scattered"},{"at":1080,"label":"A routine I can keep","layout":"aligned"}]}
```

## relationship：影响、阻碍、反馈

label最多28字符；nodes为2–6个，ID唯一，text最多18字符，x/y范围0.15–0.85。edges为1–8条；from/to引用不同节点，at不得早于两端节点出现。type为influence/block/feedback；可选label最多16字符。影响为有向线，阻碍带阻断横杠，反馈为曲线箭头，可组成循环。位置是叙述布局，不代表统计值；节点需要足够间距，避免重叠。

例一：拖延的反馈循环。

```json
{"kind":"relationship","label":"A difficult loop","nodes":[{"id":"delay","text":"Delay","at":300,"x":0.25,"y":0.3},{"id":"pressure","text":"Pressure","at":330,"x":0.75,"y":0.3},{"id":"avoid","text":"Avoidance","at":360,"x":0.5,"y":0.8}],"edges":[{"from":"delay","to":"pressure","at":390,"type":"influence","label":"builds"},{"from":"pressure","to":"avoid","at":450,"type":"influence"},{"from":"avoid","to":"delay","at":510,"type":"feedback"}]}
```

例二：通知阻碍专注，练习帮助表达。

```json
{"kind":"relationship","label":"What changes my focus","nodes":[{"id":"alerts","text":"Notifications","at":900,"x":0.2,"y":0.3},{"id":"focus","text":"Focus","at":900,"x":0.8,"y":0.3},{"id":"practice","text":"Practice","at":900,"x":0.2,"y":0.8},{"id":"expression","text":"Expression","at":900,"x":0.8,"y":0.8}],"edges":[{"from":"alerts","to":"focus","at":990,"type":"block"},{"from":"practice","to":"expression","at":1080,"type":"influence","label":"helps"}]}
```

## map：示意路线与到达

label最多28字符；places为2–6个，ID唯一，label最多18字符，x/y范围0.15–0.85。legs为1–5段，from/to引用不同地点，两端地点须在at之前或当帧出现；arriveAt必须大于at。路段按成片时间不重叠，后一段从前一段终点出发。路线上移动标记、绘线和轻推近共享同一进度；到达后回到完整路线。固定显示SCHEMATIC · NOT TO SCALE；此组件不提供真实地理底图、导航或距离推算，具体位置和经历仍需口播依据。

可选terrain为street（默认示意街道）或space（太空示意星点）；太空星点为确定性的装饰，不代表真实星图或轨道。小说情节使用space时还应在label写明fiction，终点只表达口播中的关系，不添加未提及的抵达结果。两种样式共用同一套路线/移动时间轴，不按期数分支。

例一：一天的通勤。

```json
{"kind":"map","label":"My morning commute","places":[{"id":"home","label":"Home","at":300,"x":0.2,"y":0.75},{"id":"station","label":"Station","at":300,"x":0.5,"y":0.4},{"id":"office","label":"Office","at":300,"x":0.8,"y":0.25}],"legs":[{"from":"home","to":"station","at":360,"arriveAt":450},{"from":"station","to":"office","at":480,"arriveAt":570}]}
```

例二：旅行中换一条路。

```json
{"kind":"map","label":"A different route","places":[{"id":"hotel","label":"Hotel","at":900,"x":0.2,"y":0.3},{"id":"park","label":"The park","at":900,"x":0.5,"y":0.75},{"id":"museum","label":"Museum","at":900,"x":0.8,"y":0.35}],"legs":[{"from":"hotel","to":"park","at":960,"arriveAt":1050},{"from":"park","to":"museum","at":1080,"arriveAt":1170}]}
```

## emotion：人物与情绪转折

beats为2–5个；mood为tense/frustrated/hopeful/calm/confident，label最多28字符，words为0–3个关键词、每个最多12字符。不是情绪评分，不显示百分比，不从脸部自动判断感受。依据整段原话选择；同一镜头内人物保持hero，不随mood换位。组件自己展示短句，镜头titles为空；关键词在人物上方，线条只在画框边缘，不新增配音或密集音效。

例一：挫败后找到下一步。

```json
{"kind":"emotion","beats":[{"at":300,"mood":"frustrated","label":"Nothing seemed to work.","words":["Stuck","Again"]},{"at":450,"mood":"hopeful","label":"One thing was worth trying.","words":["A new start"]}]}
```

例二：从上台前紧张到说完后的释然。

```json
{"kind":"emotion","beats":[{"at":900,"mood":"tense","label":"I nearly stayed silent.","words":["What if?"]},{"at":1020,"mood":"confident","label":"I said what I meant.","words":["Speak up"]},{"at":1170,"mood":"calm","label":"That was enough for today.","words":["Breathe"]}]}
```

## 接入与边界

把visual对象放入真实motion.json的shots[]，填写from/to、intent/action/outcome及相邻承接。scene/transformation/relationship/map使用chip，emotion使用hero且titles=[]。这里没有可直接播放的完整素材，不将示例自动写入EP10；所有方案保持现有原声、字幕与成片时钟。测试用例随实现维护，按改动执行必要测试、构建与代表段预览/渲染；执行结果必须实际记录。
