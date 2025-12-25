'use client';

import { Box, Typography, Button } from '@mui/material';
import { Inbox as InboxIcon, Add as AddIcon } from '@mui/icons-material';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        textAlign: 'center',
      }}
    >
      <Box sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}>
        {icon || <InboxIcon fontSize="inherit" />}
      </Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
          {description}
        </Typography>
      )}
      {action && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
}
