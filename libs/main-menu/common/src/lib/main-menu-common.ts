type IRoute = {
  path: string;
  label: string;
  getPath?: (id: string) => string;
};

type IMainRoutes = Record<string, IRoute>;

export const mainRoutes = {
  root: {
    path: '',
    label: 'WatchTogether'
  },
  home: {
    path: 'home',
    label: 'Home'
  },
  room: {
    path: 'room',
    getPath: (id: string) => `room/${id}`,
    label: 'Movie Room'
  }
} satisfies IMainRoutes;
