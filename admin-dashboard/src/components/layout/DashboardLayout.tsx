'use client';

import { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link as MuiLink,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Hub as HubIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const drawerWidth = 240;

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />,
  },
  {
    title: 'Reports',
    path: '/reports',
    icon: <ReportIcon />,
    children: [
      { title: 'Partners', path: '/reports/partners', icon: <BusinessIcon /> },
      { title: 'Sub-Systems', path: '/reports/sub-systems', icon: <HubIcon /> },
    ],
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: <SettingsIcon />,
    children: [
      { title: 'Partners', path: '/settings/partners', icon: <BusinessIcon /> },
      { title: 'Sub-Systems', path: '/settings/sub-systems', icon: <HubIcon /> },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  // Generate breadcrumbs from pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    return { label, path };
  });

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: (theme) =>
            theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={toggleDrawer}
            edge="start"
            sx={{ marginRight: 2 }}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Volcanion Tracking Admin
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">{user?.name || 'Guest'}</Typography>
            <IconButton onClick={handleProfileMenuOpen} color="inherit">
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.name?.[0] || 'A'}
              </Avatar>
            </IconButton>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem disabled>
              <PersonIcon sx={{ mr: 1 }} />
              {user?.email || 'admin@volcanion.local'}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : 64,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : 64,
            boxSizing: 'border-box',
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            overflowX: 'hidden',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <div key={item.path}>
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href={item.path}
                    selected={pathname === item.path}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    {open && <ListItemText primary={item.title} />}
                  </ListItemButton>
                </ListItem>
                {item.children && open && (
                  <List disablePadding sx={{ pl: 2 }}>
                    {item.children.map((child) => (
                      <ListItem key={child.path} disablePadding>
                        <ListItemButton
                          component={Link}
                          href={child.path}
                          selected={pathname === child.path}
                        >
                          <ListItemIcon>{child.icon}</ListItemIcon>
                          <ListItemText primary={child.title} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </div>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {breadcrumbs.length > 0 && (
          <Breadcrumbs sx={{ mb: 2 }}>
            <MuiLink component={Link} href="/" underline="hover" color="inherit">
              Home
            </MuiLink>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return isLast ? (
                <Typography key={crumb.path} color="text.primary">
                  {crumb.label}
                </Typography>
              ) : (
                <MuiLink
                  key={crumb.path}
                  component={Link}
                  href={crumb.path}
                  underline="hover"
                  color="inherit"
                >
                  {crumb.label}
                </MuiLink>
              );
            })}
          </Breadcrumbs>
        )}
        {children}
      </Box>
    </Box>
  );
}
