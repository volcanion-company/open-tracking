'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { partnerApi, subSystemApi } from '@/api';
import { Partner, SubSystem } from '@/types/models';
import { CreateSubSystemDto, UpdateSubSystemDto } from '@/api/subsystem.api';
import { DataTable, Column } from '@/components/common/DataTable';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export default function SubSystemsSettingsPage() {
  const [subSystems, setSubSystems] = useState<SubSystem[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSubSystem, setEditingSubSystem] = useState<SubSystem | null>(null);
  const [dialogPartnerId, setDialogPartnerId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Notifications
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadPartners();
  }, []);

  useEffect(() => {
    if (selectedPartnerId) {
      loadSubSystems();
    } else {
      setSubSystems([]);
    }
  }, [selectedPartnerId]);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const partnersData = await partnerApi.getAll();
      const activePartners = partnersData.filter((p) => p.status === 'Active');
      setPartners(activePartners);
      
      // Auto-select first partner
      if (activePartners.length > 0) {
        setSelectedPartnerId(activePartners[0].id);
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to load partners', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSubSystems = async () => {
    if (!selectedPartnerId) return;
    
    try {
      setLoading(true);
      const data = await subSystemApi.getByPartnerId(selectedPartnerId);
      setSubSystems(data.filter((s) => s.status !== 'Deleted'));
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to load sub-systems', 'error');
      setSubSystems([]);
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!dialogPartnerId) {
      errors.partnerId = 'Partner is required';
    }

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.code.trim()) {
      errors.code = 'Code is required';
    } else if (!/^[A-Z0-9_-]+$/i.test(formData.code)) {
      errors.code = 'Code can only contain letters, numbers, hyphens, and underscores';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenDialog = (subSystem?: SubSystem) => {
    if (subSystem) {
      setEditingSubSystem(subSystem);
      setDialogPartnerId(subSystem.partnerId);
      setFormData({
        name: subSystem.name,
        code: subSystem.code,
      });
    } else {
      setEditingSubSystem(null);
      setDialogPartnerId(selectedPartnerId || partners[0]?.id || '');
      setFormData({
        name: '',
        code: ''
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSubSystem(null);
    setDialogPartnerId('');
    setFormData({
      name: '',
      code: '',
    });
    setFormErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm() || !dialogPartnerId) return;

    try {
      if (editingSubSystem) {
        await subSystemApi.update(dialogPartnerId, editingSubSystem.id, {
          name: formData.name,
          status: editingSubSystem.status,
        } as UpdateSubSystemDto);
        showSnackbar('Sub-system updated successfully', 'success');
      } else {
        await subSystemApi.create(dialogPartnerId, formData);
        showSnackbar('Sub-system created successfully', 'success');
      }
      handleCloseDialog();
      // Reload the partner's sub-systems if it's the selected one
      if (dialogPartnerId === selectedPartnerId) {
        loadSubSystems();
      } else if (dialogPartnerId) {
        setSelectedPartnerId(dialogPartnerId);
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to save sub-system', 'error');
    }
  };

  const handleDelete = async (subSystem: SubSystem) => {
    if (!confirm(`Are you sure you want to delete "${subSystem.name}"?`)) return;
    if (!selectedPartnerId) return;

    try {
      await subSystemApi.delete(selectedPartnerId, subSystem.id);
      showSnackbar('Sub-system deleted successfully', 'success');
      loadSubSystems();
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to delete sub-system', 'error');
    }
  };

  const handleToggleStatus = async (subSystem: SubSystem) => {
    if (!selectedPartnerId) return;

    try {
      await subSystemApi.toggleStatus(selectedPartnerId, subSystem.id);
      const newStatus = subSystem.status === 'Active' ? 'Inactive' : 'Active';
      showSnackbar(`Sub-system ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully`, 'success');
      loadSubSystems();
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to toggle status', 'error');
    }
  };

  const columns: Column<SubSystem>[] = useMemo(
    () => [
      {
        id: 'name',
        label: 'Name',
        sortable: true,
        filterable: true,
        render: (row) => row.name,
      },
      {
        id: 'code',
        label: 'Code',
        sortable: true,
        filterable: true,
        render: (row) => <Chip label={row.code} size="small" color="primary" />,
      },
      {
        id: 'status',
        label: 'Status',
        sortable: true,
        filterable: true,
        render: (row) => (
          <Chip
            label={row.status}
            color={row.status === 'Active' ? 'success' : 'default'}
            size="small"
          />
        ),
      },
      {
        id: 'createdAt',
        label: 'Created',
        sortable: true,
        getValue: (row) => new Date(row.createdAt),
        render: (row) => new Date(row.createdAt).toLocaleDateString(),
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        width: 150,
        render: (row) => (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
            <Tooltip title={row.status === 'Active' ? 'Deactivate' : 'Activate'}>
              <IconButton 
                onClick={() => handleToggleStatus(row)} 
                size="small"
              >
                {row.status === 'Active' ? (
                  <BlockIcon fontSize="small" sx={{ color: 'error.main' }} />
                ) : (
                  <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton onClick={() => handleOpenDialog(row)} size="small">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton onClick={() => handleDelete(row)} size="small" color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    []
  );

  if (partners.length === 0 && !loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
          No partners available. Please create a partner first before adding sub-systems.
        </Alert>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Box>
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            select
            label="Partner"
            value={selectedPartnerId}
            onChange={(e) => setSelectedPartnerId(e.target.value)}
            sx={{ minWidth: 250 }}
            size="small"
          >
            {partners.map((partner) => (
              <MenuItem key={partner.id} value={partner.id}>
                {partner.name} ({partner.code})
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <DataTable
          columns={columns}
          data={subSystems}
          keyExtractor={(row) => row.id}
          defaultSortBy="name"
          searchPlaceholder="Search sub-systems..."
          emptyMessage="No sub-systems found. Create your first sub-system to get started."
          loading={loading}
          toolbarActions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              disabled={!selectedPartnerId}
            >
              Add Sub-System
            </Button>
          }
        />

        {/* Create/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingSubSystem ? 'Edit Sub-System' : 'Create Sub-System'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                select
                label="Partner"
                value={dialogPartnerId}
                onChange={(e) => setDialogPartnerId(e.target.value)}
                error={!!formErrors.partnerId}
                helperText={formErrors.partnerId}
                fullWidth
                required
                disabled={!!editingSubSystem}
              >
                {partners.map((partner) => (
                  <MenuItem key={partner.id} value={partner.id}>
                    {partner.name} ({partner.code})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={!!formErrors.name}
                helperText={formErrors.name}
                fullWidth
                required
              />

              <TextField
                label="Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                error={!!formErrors.code}
                helperText={formErrors.code || 'Unique identifier (cannot be changed after creation)'}
                fullWidth
                required
                disabled={!!editingSubSystem}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingSubSystem ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ErrorBoundary>
  );
}
