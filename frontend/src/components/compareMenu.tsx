import React, { useContext } from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';

export interface SimpleDialogProps {
    open: boolean;
    onClose: (value: string) => void;
    logoContent: {
        header: string,
        data: number[][] | string
    };
}

function SimpleDialog(props: SimpleDialogProps) {
    const { onClose, open, logoContent } = props;
    const [value, setValue] = React.useState<number[]>([0, 10]);
    const handleChange = (event: Event, newValue: number | number[]) => {
        setValue(newValue as number[]);
    };

    const handleClose = () => {
        onClose('');
    };

    const handleDownloadClick = () => {
        onClose('');
    };

    return (
        <Dialog onClose={handleClose} open={open} fullWidth={true}>
            <DialogTitle>Download Range:</DialogTitle>
            <div style={{ padding: '30px' }}>
                TEXTEXTEXTEXT
            </div>
            <br />
            <Button variant="outlined" onClick={handleDownloadClick}>
                Download
            </Button>
        </Dialog>
    );
}

export default function CompareMenu({ logoContent }: { logoContent }) {
    const [open, setOpen] = React.useState(false);
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = (value: string) => {
        setOpen(false);
    };

    React.useEffect(() => {
        const button = document.getElementById('compare-menu-btn');
        if (button) {
            button.addEventListener('click', handleClickOpen);
        }
        return () => {
            if (button) {
                button.removeEventListener('click', handleClickOpen);
            }
        };
    }, []);

    return (
        <div>
            <SimpleDialog
                open={open}
                onClose={() => setOpen(false)}
                logoContent={logoContent}
            />
        </div>
    );
}