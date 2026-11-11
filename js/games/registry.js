/* ============================================================
   Каталог — 20 известных аркадных игр
   ============================================================ */
const GAMES = [
  { id:'mario', icon:'mushroom', name:'СУПЕР МАРИО', genre:'Платформер', twoP:true, color:[230,90,60], desc:'Пробегите уровни Грибного королевства, прыгайте по платформам и побеждайте врагов.', game:'MarioGame' },
  { id:'battlecity', icon:'tank', name:'ТАНЧИКИ', genre:'Танковый экшен', twoP:true, color:[90,170,90], desc:'Управляйте танком, уничтожайте противников и защищайте штаб.', game:'TankGame' },
  { id:'duckhunt', icon:'target', name:'ОХОТА НА УТОК', genre:'Тир', twoP:false, color:[140,200,230], desc:'Попадайте по уткам, пока они не улетели. Следите за собакой!', game:'DuckHuntGame' },
  { id:'tmnt', icon:'shield', name:'ЧЕРЕПАШКИ-НИНДЗЯ', genre:'Файтинг / Кооператив', twoP:true, color:[80,200,90], desc:'Сражайтесь с кланом Фут на улицах города.', game:'TMNTGame' },
  { id:'doubledragon', icon:'fist', name:'DOUBLE DRAGON', genre:'Файтинг / Кооператив', twoP:true, color:[220,80,80], desc:'Пробивайтесь через банды, используя удары и приёмы.', game:'DoubleDragonGame' },
  { id:'mortalkombat', icon:'skull', name:'MORTAL KOMBAT', genre:'Файтинг', twoP:true, color:[200,60,50], desc:'Сразитесь один на один в турнире сильнейших бойцов.', game:'MortalKombatGame' },
  { id:'streetfighter', icon:'fist', name:'STREET FIGHTER', genre:'Файтинг', twoP:true, color:[240,200,60], desc:'Испытайте бойцов со всего мира и победите в турнире.', game:'StreetFighterGame' },
  { id:'frogger', icon:'frog', name:'FROGGER', genre:'Аркада', twoP:false, color:[110,200,90], desc:'Помогите лягушке перейти дорогу и переправиться через реку.', game:'FroggerGame' },
  { id:'galaga', icon:'spaceship', name:'GALAGA', genre:'Космический шутер', twoP:false, color:[80,120,230], desc:'Уничтожайте инопланетный флот и уклоняйтесь от атак.', game:'GalagaGame' },
  { id:'invaders', icon:'alien', name:'SPACE INVADERS', genre:'Космический шутер', twoP:false, color:[150,230,150], desc:'Остановите наступление пришельцев, пока они не достигли Земли.', game:'InvadersGame' },
  { id:'tetris', icon:'blocks', name:'ТЕТРИС', genre:'Головоломка', twoP:false, color:[90,160,230], desc:'Собирайте линии из падающих фигур и набирайте очки.', game:'TetrisGame' },
  { id:'snake', icon:'snake', name:'ЗМЕЙКА', genre:'Аркада', twoP:false, color:[110,220,110], desc:'Собирайте еду, растите и не врезайтесь в собственный хвост.', game:'SnakeGame' },
  { id:'pong', icon:'paddle', name:'PONG', genre:'Спортивная аркада', twoP:true, color:[220,220,230], desc:'Классическая дуэль на двоих. Первым наберите семь очков.', game:'PongGame' },
  { id:'arkanoid', icon:'bricks', name:'ARKANOID', genre:'Аркада', twoP:false, color:[120,180,240], desc:'Отбивайте шар платформой и разбивайте все блоки.', game:'ArkanoidGame' },
  { id:'bomberman', icon:'bomb', name:'BOMBERMAN', genre:'Экшен / Лабиринт', twoP:true, color:[240,170,60], desc:'Прокладывайте путь взрывами и побеждайте соперников.', game:'BombermanGame' },
  { id:'sonic', icon:'speed', name:'SONIC', genre:'Платформер', twoP:false, color:[60,140,240], desc:'Мчитесь на высокой скорости, собирайте кольца и обходите ловушки.', game:'SonicGame' },
  { id:'zelda', icon:'sword', name:'THE LEGEND OF ZELDA', genre:'Приключение', twoP:false, color:[220,180,80], desc:'Исследуйте подземелья, сражайтесь с монстрами и ищите сокровища.', game:'ZeldaGame' },
  { id:'contra', icon:'crosshair', name:'CONTRA', genre:'Экшен / Стрельба', twoP:true, color:[150,220,90], desc:'Пройдите опасную миссию вместе с напарником.', game:'ContraGame' },
  { id:'pacman', icon:'pacman', name:'PAC-MAN', genre:'Аркада / Лабиринт', twoP:false, color:[250,220,80], desc:'Соберите все точки в лабиринте и избегайте привидений.', game:'PacManGame' },
  { id:'castlevania', icon:'castle', name:'CASTLEVANIA', genre:'Экшен / Ужасы', twoP:false, color:[140,90,170], desc:'Проберитесь через проклятый замок и победите его обитателей.', game:'CastlevaniaGame' }
];
window.GAMES = GAMES;