import React, { useContext, useState } from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import { parseFASTA } from './logo/fasta';
import { ProteinAlphabet } from './logo/proteinlogo';
import { tolContext } from './tolContext';

export interface SimpleDialogProps {
  open: boolean;
  onClose: (value: string) => void;
  logoContent: { [key: string]: number[][] | string };
}

function SimpleDialog(props: SimpleDialogProps) {
  const { onClose, open, logoContent } = props;
  const [selections, setSelections] = useState<{ [key: string]: { items: string[], isEqual: boolean } }>({});
  const numEntries = Object.keys(logoContent).length;
  const numColumns = Math.max(0, numEntries - 1);
  const { compareSelections, setCompareSelections, setCompareDiff } = useContext(tolContext);

  const handleClose = () => {
    setSelections({});
    onClose('');
  };

  const handleCompare = () => {
    const results: number[][] = [];

    Object.entries(selections).forEach(([_, columnData]) => {
      const [item1Key, item2Key] = columnData.items;

      // Convert sequences to PPM format if needed
      const sequence1 = typeof logoContent[item1Key] === 'string'
        ? parseFASTA(ProteinAlphabet, logoContent[item1Key] as string).pfm
        : logoContent[item1Key] as number[][];

      const sequence2 = typeof logoContent[item2Key] === 'string'
        ? parseFASTA(ProteinAlphabet, logoContent[item2Key] as string).pfm
        : logoContent[item2Key] as number[][];

      const differences: number[] = [];

      sequence1.forEach((pos, index) => {
        const maxIndex1 = pos.indexOf(Math.max(...pos));
        const maxIndex2 = sequence2[index].indexOf(Math.max(...sequence2[index]));

        if ((maxIndex1 === maxIndex2) === columnData.isEqual) {
          differences.push(index);
        }
      });

      results.push(differences);
    });

    const intersectionResults = results.reduce((acc, curr) =>
      acc.filter(num => curr.includes(num))
    ).sort((a, b) => a - b);

    const formattedResults = {};

    Object.keys(logoContent).forEach((key, index) => {
      formattedResults[key] = { differing_residues: intersectionResults };
    });

    setCompareDiff(formattedResults);

    onClose('');
  };

  return (
    <Dialog onClose={handleClose} open={open} fullWidth={false} maxWidth="xl">
      <DialogTitle>Sequence Comparison</DialogTitle>
      <div style={{ padding: '30px' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[...Array(numColumns)].map((_, colIndex) => (
            <div key={colIndex} style={{ flex: 1 }}>
              <h4>Comparison {colIndex + 1}</h4>
              {Object.keys(logoContent).map((key) => (
                <Button
                  key={key}
                  variant={selections[colIndex]?.items.includes(key) ? "contained" : "outlined"}
                  onClick={() => {
                    setSelections(prev => {
                      const current = prev[colIndex]?.items || [];
                      if (current.includes(key)) {
                        return {
                          ...prev,
                          [colIndex]: {
                            isEqual: false,
                            items: current.filter(k => k !== key)
                          }
                        };
                      }
                      if (current.length < 2) {
                        return {
                          ...prev,
                          [colIndex]: {
                            isEqual: false,
                            items: [...current, key]
                          }
                        };
                      }
                      return prev;
                    });
                  }}
                  style={{ margin: '5px', width: '100%' }}
                >
                  {key}
                </Button>
              ))}
              <Button
                variant="outlined"
                onClick={() => setSelections(prev => ({
                  ...prev,
                  [colIndex]: {
                    ...prev[colIndex],
                    isEqual: !prev[colIndex]?.isEqual
                  }
                }))}
                style={{ marginTop: '10px' }}
              >
                {selections[colIndex]?.isEqual ? "==" : "!="}
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '20px' }}>
        <Button
          variant="outlined"
          onClick={() => {
            setSelections({});
            onClose('');
            setCompareDiff({});
          }}
          color="error"
        >
          Clear All
        </Button>
        <Button
          variant="contained"
          onClick={handleCompare}
          disabled={Object.values(selections).some(col => col.items.length !== 2) || Object.keys(selections).length === 0}
        >
          Compare
        </Button>
      </div>
    </Dialog>
  );
}

interface CompareMenuProps {
  logoContent: { [key: string]: number[][] | string };
}

export default function CompareMenu({ logoContent }: CompareMenuProps) {
  const [open, setOpen] = React.useState<boolean>(false);
  const handleClickOpen = () => {
    setOpen(true);
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