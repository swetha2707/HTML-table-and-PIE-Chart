import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

interface Employee {
  name: string;
  totalHours: number;
  percentage?: number;
}

@Component({
  selector: 'app-root',
  template: `
    <div class="container">
      <h1>Employee Time Tracker</h1>
      <p><strong> HTML TABLE + PIE CHART</strong></p>
      
      <!-- Status Indicator -->
      <div class="feature-status">
        <span class="status-item">📊 HTML Table: Ready</span>
        <span class="status-item">🥧 Pie Chart: {{ chart ? 'Loaded' : 'Loading...' }}</span>
      </div>
      
      <div *ngIf="loading" class="loading">Loading employee data...</div>
      
      <div *ngIf="error" class="error">
        <p>{{ error }}</p>
        <button (click)="loadData()">Retry</button>
      </div>
      
      <div *ngIf="!loading && !error" class="content">
        <!-- Employee Table -->
        <div class="table-section">
          <h2>📊 HTML TABLE - Employee Hours Summary</h2>
          <p class="section-subtitle">Click column headers to sort data</p>
          <table class="employee-table">
            <thead>
              <tr>
                <th (click)="sortBy('name')" class="sortable">
                  Employee Name {{ getSortIcon('name') }}
                </th>
                <th (click)="sortBy('totalHours')" class="sortable">
                  Total Hours {{ getSortIcon('totalHours') }}
                </th>
                <th>Percentage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let emp of employees" [class.low-hours]="emp.totalHours < 100">
                <td>{{ emp.name }}</td>
                <td>{{ emp.totalHours }}h</td>
                <td>{{ emp.percentage }}%</td>
                <td>
                  <span class="badge" [class.warning]="emp.totalHours < 100">
                    {{ emp.totalHours < 100 ? 'Under 100h' : 'Normal' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div class="summary">
            <p><strong>Total Employees:</strong> {{ employees.length }}</p>
            <p><strong>Low Hours (&lt;100h):</strong> {{ getLowHoursCount() }}</p>
          </div>
        </div>

        <!-- Pie Chart -->
        <div class="chart-section">
          <h2>🥧 PIE CHART - Time Distribution</h2>
          <p class="section-subtitle">Interactive visualization of employee hours</p>
          <div class="chart-container">
            <canvas #pieChart width="400" height="400"></canvas>
            
            <!-- Fallback chart info if canvas fails -->
            <div *ngIf="!chart" class="chart-fallback">
              <h4>Chart Data (if chart not visible):</h4>
              <div class="fallback-data">
                <div *ngFor="let emp of employees" class="data-row">
                  <span class="emp-name">{{ emp.name }}</span>
                  <span class="emp-hours">{{ emp.totalHours }}h ({{ emp.percentage }}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    h1 {
      color: #333;
      text-align: center;
      margin-bottom: 10px;
      font-size: 2.2rem;
    }
    
    p {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }
    
    .loading, .error {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .error button {
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
    }

    .content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 30px;
      margin-top: 20px;
    }

    @media (max-width: 768px) {
      .content {
        grid-template-columns: 1fr;
      }
    }

    .table-section {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .table-section h2 {
      background-color: #f8f9fa;
      margin: 0;
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
      color: #333;
      font-size: 1.3rem;
      font-weight: 500;
    }
    
    .employee-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .employee-table th {
      background: #007bff;
      color: white;
      padding: 15px;
      text-align: left;
      font-weight: 600;
    }
    
    .sortable {
      cursor: pointer;
      user-select: none;
    }
    
    .sortable:hover {
      background: #0056b3;
    }
    
    .employee-table td {
      padding: 15px;
      border-bottom: 1px solid #eee;
    }
    
    .employee-table tr:hover {
      background: #f8f9fa;
    }
    
    .low-hours {
      background: #fff3cd !important;
    }
    
    .low-hours:hover {
      background: #ffeaa7 !important;
    }
    
    .badge {
      background: #28a745;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 500;
    }
    
    .badge.warning {
      background: #ffc107;
      color: #856404;
    }
    
    .summary {
      background: #f8f9fa;
      padding: 15px 20px;
      border-top: 1px solid #eee;
    }
    
    .summary p {
      margin: 5px 0;
      text-align: left;
    }

    .feature-status {
      text-align: center;
      margin: 20px 0;
      padding: 15px;
      background: rgba(255,255,255,0.9);
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .status-item {
      display: inline-block;
      margin: 0 15px;
      padding: 8px 16px;
      background: #e8f5e8;
      border-radius: 20px;
      font-weight: 600;
      color: #2d5a2d;
    }

    .section-subtitle {
      color: #666;
      font-style: italic;
      margin: 0;
      padding: 0 20px 10px;
    }

    .chart-section {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .chart-section h2 {
      background-color: #f8f9fa;
      margin: 0;
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
      color: #333;
      font-size: 1.3rem;
      font-weight: 500;
    }

    .chart-container {
      position: relative;
      height: 400px;
      padding: 20px;
    }

    @media (max-width: 768px) {
      .chart-container {
        height: 300px;
      }
    }

    .chart-fallback {
      margin-top: 20px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #dee2e6;
    }

    .chart-fallback h4 {
      margin: 0 0 15px 0;
      color: #495057;
    }

    .fallback-data {
      display: grid;
      gap: 8px;
    }

    .data-row {
      display: flex;
      justify-content: space-between;
      padding: 8px;
      background: white;
      border-radius: 4px;
      border-left: 4px solid #007bff;
    }

    .emp-name {
      font-weight: 600;
    }

    .emp-hours {
      color: #007bff;
      font-weight: 500;
    }
  `]
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('pieChart', { static: false }) pieChartRef!: ElementRef<HTMLCanvasElement>;
  employees: Employee[] = [];
  loading = true;
  error = '';
  sortColumn = 'totalHours';
  sortDirection: 'asc' | 'desc' = 'desc';
  public chart: Chart | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
    // Chart will be created after data is loaded
  }

  loadData() {
    this.loading = true;
    this.error = '';

    // Sample data for interview demonstration
    setTimeout(() => {
      const rawData = [
        { name: 'John Smith', totalHours: 120.5 },
        { name: 'Sarah Johnson', totalHours: 95.2 },
        { name: 'Mike Wilson', totalHours: 156.8 },
        { name: 'Lisa Brown', totalHours: 88.3 },
        { name: 'David Davis', totalHours: 134.7 },
        { name: 'Anna Taylor', totalHours: 76.9 },
        { name: 'James Miller', totalHours: 145.2 },
        { name: 'Emily Clark', totalHours: 92.1 },
        { name: 'Robert Lee', totalHours: 168.4 },
        { name: 'Jennifer White', totalHours: 103.6 }
      ];

      // Calculate total hours for percentage
      const totalHours = rawData.reduce((sum, emp) => sum + emp.totalHours, 0);
      
      // Add percentage to each employee
      this.employees = rawData.map(emp => ({
        ...emp,
        percentage: Math.round((emp.totalHours / totalHours) * 100 * 100) / 100
      }));
      
      this.sortEmployees();
      this.loading = false;
      
      // Create chart after data is loaded
      setTimeout(() => {
        this.createPieChart();
      }, 0);
    }, 1000);
  }

  sortBy(column: keyof Employee) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = column === 'totalHours' ? 'desc' : 'asc';
    }
    this.sortEmployees();
  }

  sortEmployees() {
    this.employees.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      if (this.sortColumn === 'name') {
        aValue = a.name;
        bValue = b.name;
      } else {
        aValue = a.totalHours;
        bValue = b.totalHours;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return this.sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return this.sortDirection === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return '↕';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  getLowHoursCount(): number {
    return this.employees.filter(emp => emp.totalHours < 100).length;
  }

  private createPieChart() {
    if (!this.pieChartRef || this.employees.length === 0) {
      return;
    }

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.pieChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Generate colors for the pie chart
    const colors = this.generateColors(this.employees.length);

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: this.employees.map(emp => emp.name),
        datasets: [{
          data: this.employees.map(emp => emp.totalHours),
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.8', '1')),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Employee Time Distribution',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'bottom',
            labels: {
              padding: 10,
              usePointStyle: true,
              font: {
                size: 11
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const employee = this.employees[context.dataIndex];
                return `${employee.name}: ${employee.totalHours}h (${employee.percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private generateColors(count: number): string[] {
    const colors = [
      'rgba(255, 99, 132, 0.8)',   'rgba(54, 162, 235, 0.8)',   'rgba(255, 205, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',   'rgba(153, 102, 255, 0.8)',  'rgba(255, 159, 64, 0.8)',
      'rgba(199, 199, 199, 0.8)',  'rgba(83, 102, 255, 0.8)',   'rgba(255, 99, 255, 0.8)',
      'rgba(99, 255, 132, 0.8)'
    ];

    if (count > colors.length) {
      for (let i = colors.length; i < count; i++) {
        const hue = (i * 137.508) % 360;
        colors.push(`hsla(${hue}, 70%, 60%, 0.8)`);
      }
    }

    return colors.slice(0, count);
  }
}