# src/episodes/

每一期的画面代码放在这里，一期一个目录（例如 `src/episodes/e12-<slug>/`）。这个目录下的内容不入库，只有本说明会提交。

每期至少要有一个 `Episode.tsx`，导出 `episode`，`src/Root.tsx` 会自动发现并注册成 Studio 合成：

```tsx
import { withEpisodeData, type EpisodeEntry, type Timeline } from "../../kit/EpisodeData";

const Episode: React.FC<{ data: Timeline; dir: string }> = ({ data, dir }) => {
  // 用 src/kit/ 的系列组件 + 本期世界组件，按 SERIES.md 制作
};

export const episode: EpisodeEntry = {
  id: "E12-MyEpisode",
  dir: "ep12", // 素材目录 public/ep12/（cut.mp4 + timeline.json）
  component: withEpisodeData(Episode),
};
```

素材缺失时，合成会显示说明卡，不会报错。制作流程见 [README](../../README.md) 和 [SERIES.md](../../SERIES.md)。
