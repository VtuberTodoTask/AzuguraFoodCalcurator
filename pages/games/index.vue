<template>
  <div class="games-menu">
    <h1>暇つぶし</h1>
    <nav>
      <ul>
        <li><NuxtLink to="/games/snake">スネークゲーム</NuxtLink></li>
        <li><NuxtLink to="/games/flappy">フラッピーバード</NuxtLink></li>
        <li><NuxtLink to="/games/tetris">テトリス</NuxtLink></li>
        <li><NuxtLink to="/games/2048">２０４８</NuxtLink></li>
        <li><NuxtLink to="/games/minesweeper">マインスイーパー</NuxtLink></li>
      </ul>
    </nav>
  </div>
</template>

<style scoped>
.games-menu {
  text-align: center;
  margin-top: 50px;
}
.games-menu h1 {
  margin-bottom: 30px;
}
nav ul {
  list-style: none;
  padding: 0;
}
nav li {
  margin: 15px 0;
}
nav a {
  font-size: 1.5rem;
  text-decoration: none;
  color: var(--primary-color);
  transition: color 0.3s;
}
nav a:hover {
  color: var(--accent-color);
}
</style>
